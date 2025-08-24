import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { PrometheusService } from '../monitoring/prometheus.service';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [DrizzleModule],
  providers: [AdminService, PrometheusService, RateLimitService],
  controllers: [AdminController],
})
export class AdminModule {}
