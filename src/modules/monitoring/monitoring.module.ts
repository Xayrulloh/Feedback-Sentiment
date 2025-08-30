import { Module } from '@nestjs/common';
import * as client from 'prom-client';
import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';
import { PrometheusService } from './prometheus.service';

@Module({
  providers: [
    {
      provide: 'PROM_REGISTRY',
      useValue: new client.Registry(),
    },
    MonitoringService,
    PrometheusService,
  ],
  controllers: [MonitoringController],
  exports: [MonitoringService, PrometheusService],
})
export class MonitoringModule {}
