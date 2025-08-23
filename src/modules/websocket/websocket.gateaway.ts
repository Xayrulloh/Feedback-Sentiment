import { Injectable } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { WebSocketEventSchemaType } from './dto/websocket.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { SocketMiddleware } from './socket.middleware';

@WebSocketGateway({ cors: { origin: '*' } })
@Injectable()
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private activeUsers = new Set<string>();

  constructor(private readonly websocketMiddleware: SocketMiddleware) {}

  afterInit(server: Server) {
    server.use((socket, next) => this.websocketMiddleware.use(socket, next));
  }

  handleConnection(client: Socket) {
    const user = client.data.user;
    this.activeUsers.add(user.id);

    if (user.role === 'admin') {
      client.join('admin');
    }

    this.notifyAll({
      event: 'activeUsers',
      data: this.activeUsers.size,
    });
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    this.activeUsers.delete(user.id);

    this.notifyAll({
      event: 'activeUsers',
      data: this.activeUsers.size,
    });
    
  }

  notifyAll(payload: WebSocketEventSchemaType) {
    this.server.emit(payload.event, payload.data);
  }

  notifyAdmin(payload: WebSocketEventSchemaType) {
    this.server.to('admin').emit(payload.event, payload.data);
  }
}
