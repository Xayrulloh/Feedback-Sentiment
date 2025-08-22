import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import type {
  SuspiciousActivitySchemaType,
  UserActivitySchemaType,
} from './dto/websocket.dto';

@Injectable()
export class WebSocketService implements OnModuleDestroy {
  private readonly logger = new Logger(WebSocketService.name);
  private redis: Redis;
  private readonly ACTIVE_USERS_KEY = 'websocket:active_users';
  private readonly SUSPICIOUS_ACTIVITIES_KEY =
    'websocket:suspicious_activities';
  private readonly ADMIN_SOCKETS_KEY = 'websocket:admin_sockets';
  private readonly USER_EXPIRY_SECONDS = 86400; // 24 hours
  private readonly ADMIN_EXPIRY_SECONDS = 3600; // 1 hour

  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
    });

    this.redis.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  async addActiveUser(userActivity: UserActivitySchemaType): Promise<void> {
    try {
      const userKey = `${this.ACTIVE_USERS_KEY}:${userActivity.userId}`;

      await this.redis.setex(
        userKey,
        this.USER_EXPIRY_SECONDS,
        JSON.stringify(userActivity),
      );

      await this.redis.hset(
        this.ACTIVE_USERS_KEY,
        userActivity.userId,
        JSON.stringify(userActivity),
      );

      this.logger.log(`Added active user: ${userActivity.email}`);
    } catch (error) {
      this.logger.error('Error adding active user:', error);
      throw error;
    }
  }

  async removeActiveUser(userId: string): Promise<void> {
    try {
      const userKey = `${this.ACTIVE_USERS_KEY}:${userId}`;

      await Promise.all([
        this.redis.del(userKey),
        this.redis.hdel(this.ACTIVE_USERS_KEY, userId),
      ]);

      this.logger.log(`Removed active user: ${userId}`);
    } catch (error) {
      this.logger.error('Error removing active user:', error);
      throw error;
    }
  }

  async getActiveUsers(): Promise<UserActivitySchemaType[]> {
    try {
      const users = await this.redis.hgetall(this.ACTIVE_USERS_KEY);
      return Object.values(users).map((user) => JSON.parse(user));
    } catch (error) {
      this.logger.error('Error getting active users:', error);
      return [];
    }
  }

  async updateUserActivity(userId: string): Promise<boolean> {
    try {
      const userStr = await this.redis.hget(this.ACTIVE_USERS_KEY, userId);
      if (!userStr) {
        return false;
      }

      const user = JSON.parse(userStr) as UserActivitySchemaType;
      user.lastActivity = new Date();

      const userKey = `${this.ACTIVE_USERS_KEY}:${userId}`;

      await Promise.all([
        this.redis.setex(
          userKey,
          this.USER_EXPIRY_SECONDS,
          JSON.stringify(user),
        ),
        this.redis.hset(this.ACTIVE_USERS_KEY, userId, JSON.stringify(user)),
      ]);

      return true;
    } catch (error) {
      this.logger.error('Error updating user activity:', error);
      return false;
    }
  }

  async isUserActive(userId: string): Promise<boolean> {
    try {
      const exists = await this.redis.hexists(this.ACTIVE_USERS_KEY, userId);
      return exists === 1;
    } catch (error) {
      this.logger.error('Error checking if user is active:', error);
      return false;
    }
  }

  async addSuspiciousActivity(
    activity: Omit<SuspiciousActivitySchemaType, 'id' | 'timestamp'>,
  ): Promise<SuspiciousActivitySchemaType> {
    try {
      const suspiciousActivity: SuspiciousActivitySchemaType = {
        ...activity,
        id: uuidv4(),
        timestamp: new Date(),
      };

      await this.redis.lpush(
        this.SUSPICIOUS_ACTIVITIES_KEY,
        JSON.stringify(suspiciousActivity),
      );

      await this.redis.ltrim(this.SUSPICIOUS_ACTIVITIES_KEY, 0, 999);

      this.logger.warn(
        `Suspicious activity detected: ${activity.activityType} for user ${activity.userId}`,
      );

      return suspiciousActivity;
    } catch (error) {
      this.logger.error('Error adding suspicious activity:', error);
      throw error;
    }
  }

  async getSuspiciousActivities(
    limit: number = 50,
  ): Promise<SuspiciousActivitySchemaType[]> {
    try {
      const activities = await this.redis.lrange(
        this.SUSPICIOUS_ACTIVITIES_KEY,
        0,
        Math.min(limit - 1, 999),
      );
      return activities.map((activity) => JSON.parse(activity));
    } catch (error) {
      this.logger.error('Error getting suspicious activities:', error);
      return [];
    }
  }

  async getSuspiciousActivitiesByUser(
    userId: string,
    limit: number = 20,
  ): Promise<SuspiciousActivitySchemaType[]> {
    try {
      const allActivities = await this.getSuspiciousActivities(500);
      return allActivities
        .filter((activity) => activity.userId === userId)
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Error getting user suspicious activities:', error);
      return [];
    }
  }

  async addAdminSocket(adminId: string, socketId: string): Promise<void> {
    try {
      const adminKey = `${this.ADMIN_SOCKETS_KEY}:${adminId}`;
      await this.redis.sadd(adminKey, socketId);
      await this.redis.expire(adminKey, this.ADMIN_EXPIRY_SECONDS);

      this.logger.log(`Admin ${adminId} socket ${socketId} added`);
    } catch (error) {
      this.logger.error('Error adding admin socket:', error);
      throw error;
    }
  }

  async removeAdminSocket(adminId: string, socketId: string): Promise<void> {
    try {
      const adminKey = `${this.ADMIN_SOCKETS_KEY}:${adminId}`;
      await this.redis.srem(adminKey, socketId);

      const count = await this.redis.scard(adminKey);
      if (count === 0) {
        await this.redis.del(adminKey);
      }

      this.logger.log(`Admin ${adminId} socket ${socketId} removed`);
    } catch (error) {
      this.logger.error('Error removing admin socket:', error);
    }
  }

  async getAllAdminSockets(): Promise<string[]> {
    try {
      const adminKeys = await this.redis.keys(`${this.ADMIN_SOCKETS_KEY}:*`);
      if (adminKeys.length === 0) return [];

      const allSockets: string[] = [];

      for (const key of adminKeys) {
        const sockets = await this.redis.smembers(key);
        allSockets.push(...sockets);
      }

      return [...new Set(allSockets)]; 
    } catch (error) {
      this.logger.error('Error getting admin sockets:', error);
      return [];
    }
  }

  async getAdminSocketsByAdminId(adminId: string): Promise<string[]> {
    try {
      const adminKey = `${this.ADMIN_SOCKETS_KEY}:${adminId}`;
      return await this.redis.smembers(adminKey);
    } catch (error) {
      this.logger.error('Error getting admin sockets by ID:', error);
      return [];
    }
  }

  async cleanupInactiveUsers(
    inactiveThresholdMinutes: number = 30,
  ): Promise<number> {
    try {
      const activeUsers = await this.getActiveUsers();
      const now = new Date();
      let cleanedCount = 0;

      for (const user of activeUsers) {
        const lastActivity = new Date(user.lastActivity);
        const minutesInactive =
          (now.getTime() - lastActivity.getTime()) / (1000 * 60);

        if (minutesInactive > inactiveThresholdMinutes) {
          await this.removeActiveUser(user.userId);
          cleanedCount++;
        }
      }

      if (cleanedCount > 0) {
        this.logger.log(`Cleaned up ${cleanedCount} inactive users`);
      }

      return cleanedCount;
    } catch (error) {
      this.logger.error('Error cleaning up inactive users:', error);
      return 0;
    }
  }

  async getActiveUserCount(): Promise<number> {
    try {
      return await this.redis.hlen(this.ACTIVE_USERS_KEY);
    } catch (error) {
      this.logger.error('Error getting active user count:', error);
      return 0;
    }
  }

  async getUserActivity(
    userId: string,
  ): Promise<UserActivitySchemaType | null> {
    try {
      const userStr = await this.redis.hget(this.ACTIVE_USERS_KEY, userId);
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      this.logger.error('Error getting user activity:', error);
      return null;
    }
  }
}
