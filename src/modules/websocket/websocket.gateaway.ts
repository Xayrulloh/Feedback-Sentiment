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
import { SocketMiddleware } from './socket.middleware';

@Injectable()
@WebSocketGateway({ cors: { origin: '*' } })
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly websocketMiddleware: SocketMiddleware) {}

  afterInit(server: Server) {
    server.use((socket, next: (err?: Error) => void) =>
      this.websocketMiddleware.use(socket, next),
    );
  }

  handleConnection(client: Socket) {
    const user = client.data.user;

    if (user.role === 'ADMIN') {
      client.join('admin');
    }

    this.notifyAll({
      event: 'activeUsers',
      data: this.server.sockets.sockets.size,
    });
  }

  handleDisconnect() {
    this.notifyAll({
      event: 'activeUsers',
      data: this.server.sockets.sockets.size,
    });
  }

  notifyAll(payload: WebSocketEventSchemaType) {
    this.server.emit(payload.event, payload.data);
  }

  notifyAdmin(payload: WebSocketEventSchemaType) {
    this.server.to('admin').emit(payload.event, payload.data);
  }
}
