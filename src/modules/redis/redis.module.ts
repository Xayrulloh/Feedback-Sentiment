import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';
import type { EnvType } from 'src/config/env/env-validation';

@Module({
  imports: [ConfigModule], // 👈 important
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<EnvType>) => {
        const redisInstance = new Redis({
          host: configService.getOrThrow('REDIS_HOST'),
          port: configService.getOrThrow('REDIS_PORT', 6379),
        });

        redisInstance.on('connect', () => {
          Logger.log('Redis client connected');
        });
        redisInstance.on('error', (error) => {
          Logger.error('Redis client error', error);
        });

        return redisInstance;
      },
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class RedisModule {}
