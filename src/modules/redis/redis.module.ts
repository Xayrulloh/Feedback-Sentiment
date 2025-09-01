import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { EnvType } from 'src/config/env/env-validation';
import { RedisService } from './redis.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<EnvType>) => {
        const redisInstance = new Redis({
          host: configService.getOrThrow<EnvType['REDIS_HOST']>('REDIS_HOST'),
          port: configService.getOrThrow<EnvType['REDIS_PORT']>('REDIS_PORT'),
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
