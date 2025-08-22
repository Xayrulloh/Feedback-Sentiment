// src/monitoring/monitoring.module.ts
import { Module } from '@nestjs/common';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { PrometheusService } from './prometheus.service';

@Module({
  controllers: [MonitoringController],
  providers: [MonitoringService, PrometheusService],
  exports: [MonitoringService, PrometheusService],
})
export class MonitoringModule {}
