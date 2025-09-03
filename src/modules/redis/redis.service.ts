import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import type { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }

  async get(key: string): Promise<string | null> {
    const value = await this.redisClient.get(key);

    return value;
  }

  async set(key: string, value: string): Promise<void> {
    await this.redisClient.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async setWithExpiry(
    key: string,
    value: string,
    expiry: number,
  ): Promise<void> {
    await this.redisClient.set(key, value, 'EX', expiry);
  }

  async keys(pattern: string): Promise<string[]> {
    const keys = await this.redisClient.keys(pattern);

    return keys;
  }

  async ttl(key: string): Promise<number> {
    const ttl = await this.redisClient.ttl(key);

    return ttl;
  }

  async clearUserCache(userId: string): Promise<void> {
    const keys = [
      `feedback:sentiment-summary:${userId}`,
      `feedback:grouped:${userId}`,
      `feedback:report:${userId}:detailed:csv`,
      `feedback:report:${userId}:detailed:pdf`,
      `feedback:report:${userId}:summary:csv`,
      `feedback:report:${userId}:summary:pdf`,
    ];

    if (keys.length > 0) {
      await this.redisClient.del(...keys);
    }
  }
}
