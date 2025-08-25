import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { PrometheusService } from '../monitoring/prometheus.service';
import { RedisModule } from '../redis/redis.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [DrizzleModule, RedisModule],
  providers: [AdminService, PrometheusService],
  controllers: [AdminController],
})
export class AdminModule {}
