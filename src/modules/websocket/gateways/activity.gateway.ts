import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { UserActivitySchemaType } from '../dto/websocket.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { WebSocketService } from '../websocket.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: '/user-tracking',
})
export class ActivityGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(ActivityGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly websocketService: WebSocketService) {}

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.auth?.userId;
      const email = client.handshake.auth?.email;

      if (!userId || !email) {
        this.logger.warn(
          `Connection rejected: Missing userId or email from ${client.id}`,
        );
        client.emit('error', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        this.logger.warn(
          `Connection rejected: Invalid userId format from ${client.id}`,
        );
        client.emit('error', { message: 'Invalid user ID format' });
        client.disconnect();
        return;
      }

      const userActivity: UserActivitySchemaType = {
        userId,
        email,
        connectedAt: new Date(),
        lastActivity: new Date(),
        socketId: client.id,
      };

      await this.websocketService.addActiveUser(userActivity);

      await client.join(`user:${userId}`);

      client.emit('connected', {
        message: 'Successfully connected to user tracking',
        userId,
        timestamp: new Date(),
      });

      await this.notifyAdmins('USER_JOINED', userActivity);

      this.logger.log(
        `User ${email} (${userId}) connected with socket ${client.id}`,
      );

      this.setupActivityHeartbeat(client, userId);
    } catch (error) {
      this.logger.error('Error handling connection:', error);
      client.emit('error', { message: 'Internal server error' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = client.handshake.auth?.userId;
      const email = client.handshake.auth?.email;

      if (userId) {
        await this.websocketService.removeActiveUser(userId);

        await this.notifyAdmins('USER_LEFT', {
          userId,
          email: email || 'unknown',
          socketId: client.id,
          connectedAt: new Date(),
          lastActivity: new Date(),
        } as UserActivitySchemaType);

        this.logger.log(
          `User ${email || 'unknown'} (${userId}) disconnected from socket ${client.id}`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling disconnect:', error);
    }
  }

  @SubscribeMessage('heartbeat')
  async handleHeartbeat(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.handshake.auth?.userId;
      if (!userId) return;

      const updated = await this.websocketService.updateUserActivity(userId);

      if (updated) {
        client.emit('heartbeat-ack', { timestamp: new Date() });
      } else {
        client.emit('error', { message: 'Session expired, please reconnect' });
        client.disconnect();
      }
    } catch (error) {
      this.logger.error('Error handling heartbeat:', error);
    }
  }

  @SubscribeMessage('user-activity')
  async handleUserActivity(@ConnectedSocket() client: Socket) {
    try {
      const userId = client.handshake.auth?.userId;
      if (!userId) return;

      await this.websocketService.updateUserActivity(userId);
    } catch (error) {
      this.logger.error('Error handling user activity:', error);
    }
  }

  private setupActivityHeartbeat(client: Socket, userId: string) {
    const heartbeatInterval = setInterval(async () => {
      try {
        if (!client.connected) {
          clearInterval(heartbeatInterval);
          return;
        }

        const isActive = await this.websocketService.isUserActive(userId);
        if (!isActive) {
          client.emit('error', { message: 'Session expired' });
          client.disconnect();
          clearInterval(heartbeatInterval);
        }
      } catch (error) {
        this.logger.error('Error in heartbeat check:', error);
        clearInterval(heartbeatInterval);
      }
    }, 60000); 

    client.on('disconnect', () => {
      clearInterval(heartbeatInterval);
    });
  }

  private async notifyAdmins(type: string, data: UserActivitySchemaType) {
    try {
      const notification = {
        type,
        data,
        timestamp: new Date(),
      };

      this.server.of('/admin').emit('user-activity', notification);

      this.logger.debug(`Notified admins about: ${type}`);
    } catch (error) {
      this.logger.error('Error notifying admins:', error);
    }
  }

  async sendToUser(userId: string, event: string, data: unknown) {
    try {
      this.server.to(`user:${userId}`).emit(event, data);
    } catch (error) {
      this.logger.error('Error sending message to user:', error);
    }
  }

  async broadcastToAllUsers(event: string, data: unknown) {
    try {
      this.server.emit(event, data);
    } catch (error) {
      this.logger.error('Error broadcasting to all users:', error);
    }
  }
}
