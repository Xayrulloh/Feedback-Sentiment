import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { SuspiciousActivitySchemaType } from '../dto/websocket.dto';
// biome-ignore lint/style/useImportType: Needed for DI
import { WebSocketService } from '../websocket.service';

interface GetSuspiciousActivitiesDto {
  limit?: number;
  userId?: string;
}

interface AdminAuthData {
  adminId: string;
  isAdmin: boolean;
  email?: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
  },
  namespace: '/admin',
})
export class AdminGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AdminGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(private readonly websocketService: WebSocketService) {}

  async handleConnection(client: Socket) {
    try {
      const authData = client.handshake.auth as AdminAuthData;
      const { adminId, isAdmin, email } = authData;

      if (!adminId || !isAdmin) {
        this.logger.warn(
          `Admin connection rejected: Invalid credentials from ${client.id}`,
        );
        client.emit('error', { message: 'Admin authentication required' });
        client.disconnect();
        return;
      }

      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(adminId)) {
        this.logger.warn(
          `Admin connection rejected: Invalid adminId format from ${client.id}`,
        );
        client.emit('error', { message: 'Invalid admin ID format' });
        client.disconnect();
        return;
      }

      await this.websocketService.addAdminSocket(adminId, client.id);

      await client.join('admins');
      await client.join(`admin:${adminId}`);

      this.logger.log(
        `Admin ${email || adminId} connected with socket ${client.id}`,
      );

      const [activeUsers, suspiciousActivities] = await Promise.all([
        this.websocketService.getActiveUsers(),
        this.websocketService.getSuspiciousActivities(50),
      ]);

      client.emit('initial-data', {
        activeUsers,
        suspiciousActivities,
        timestamp: new Date(),
      });

      client.emit('connected', {
        message: 'Successfully connected to admin panel',
        adminId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error handling admin connection:', error);
      client.emit('error', { message: 'Internal server error' });
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const authData = client.handshake.auth as AdminAuthData;
      const adminId = authData?.adminId;

      if (adminId) {
        await this.websocketService.removeAdminSocket(adminId, client.id);
        this.logger.log(
          `Admin ${adminId} disconnected from socket ${client.id}`,
        );
      }
    } catch (error) {
      this.logger.error('Error handling admin disconnect:', error);
    }
  }

  @SubscribeMessage('get-active-users')
  async handleGetActiveUsers(@ConnectedSocket() client: Socket) {
    try {
      const activeUsers = await this.websocketService.getActiveUsers();
      const userCount = await this.websocketService.getActiveUserCount();

      client.emit('active-users', {
        users: activeUsers,
        count: userCount,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error getting active users:', error);
      client.emit('error', { message: 'Failed to get active users' });
    }
  }

  @SubscribeMessage('get-suspicious-activities')
  async handleGetSuspiciousActivities(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: GetSuspiciousActivitiesDto = {},
  ) {
    try {
      const { limit = 50, userId } = data;

      let activities: SuspiciousActivitySchemaType[];

      if (userId) {
        activities = await this.websocketService.getSuspiciousActivitiesByUser(
          userId,
          limit,
        );
      } else {
        activities = await this.websocketService.getSuspiciousActivities(limit);
      }

      client.emit('suspicious-activities', {
        activities,
        count: activities.length,
        userId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error getting suspicious activities:', error);
      client.emit('error', { message: 'Failed to get suspicious activities' });
    }
  }

  @SubscribeMessage('get-user-activity')
  async handleGetUserActivity(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    try {
      const { userId } = data;

      if (!userId) {
        client.emit('error', { message: 'User ID is required' });
        return;
      }

      const [userActivity, suspiciousActivities] = await Promise.all([
        this.websocketService.getUserActivity(userId),
        this.websocketService.getSuspiciousActivitiesByUser(userId, 20),
      ]);

      client.emit('user-activity-details', {
        userActivity,
        suspiciousActivities,
        userId,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error getting user activity details:', error);
      client.emit('error', { message: 'Failed to get user activity details' });
    }
  }

  @SubscribeMessage('cleanup-inactive-users')
  async handleCleanupInactiveUsers(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { thresholdMinutes?: number } = {},
  ) {
    try {
      const { thresholdMinutes = 30 } = data;
      const cleanedCount =
        await this.websocketService.cleanupInactiveUsers(thresholdMinutes);

      client.emit('cleanup-result', {
        cleanedCount,
        thresholdMinutes,
        timestamp: new Date(),
      });

      const activeUsers = await this.websocketService.getActiveUsers();
      this.server.to('admins').emit('active-users-updated', {
        users: activeUsers,
        count: activeUsers.length,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error cleaning up inactive users:', error);
      client.emit('error', { message: 'Failed to cleanup inactive users' });
    }
  }

  async emitSuspiciousActivity(activity: SuspiciousActivitySchemaType) {
    try {
      const notification = {
        type: 'SUSPICIOUS_ACTIVITY',
        data: activity,
        timestamp: new Date(),
      };

      this.server.to('admins').emit('suspicious-activity', notification);
      this.logger.debug(
        `Emitted suspicious activity to admins: ${activity.activityType}`,
      );
    } catch (error) {
      this.logger.error('Error emitting suspicious activity:', error);
    }
  }

  async emitUserActivityUpdate(type: 'USER_JOINED' | 'USER_LEFT', data: unknown) {
    try {
      const notification = {
        type,
        data,
        timestamp: new Date(),
      };

      this.server.to('admins').emit('user-activity', notification);
      this.logger.debug(`Emitted user activity update to admins: ${type}`);
    } catch (error) {
      this.logger.error('Error emitting user activity update:', error);
    }
  }

  async sendToAdmin(adminId: string, event: string, data: unknown) {
    try {
      this.server.to(`admin:${adminId}`).emit(event, data);
    } catch (error) {
      this.logger.error('Error sending message to admin:', error);
    }
  }

  async broadcastSystemAlert(
    message: string,
    severity: 'info' | 'warning' | 'error' = 'info',
  ) {
    try {
      this.server.to('admins').emit('system-alert', {
        message,
        severity,
        timestamp: new Date(),
      });
    } catch (error) {
      this.logger.error('Error broadcasting system alert:', error);
    }
  }

  @SubscribeMessage('get-admin-stats')
  async handleGetAdminStats(@ConnectedSocket() client: Socket) {
    try {
      const [activeUserCount, recentSuspiciousActivities, adminSockets] =
        await Promise.all([
          this.websocketService.getActiveUserCount(),
          this.websocketService.getSuspiciousActivities(10),
          this.websocketService.getAllAdminSockets(),
        ]);

      const stats = {
        activeUserCount,
        recentSuspiciousCount: recentSuspiciousActivities.length,
        connectedAdminsCount: adminSockets.length,
        lastActivity: recentSuspiciousActivities[0]?.timestamp || null,
        timestamp: new Date(),
      };

      client.emit('admin-stats', stats);
    } catch (error) {
      this.logger.error('Error getting admin stats:', error);
      client.emit('error', { message: 'Failed to get admin stats' });
    }
  }
}
