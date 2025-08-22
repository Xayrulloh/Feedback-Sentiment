import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MonitoringService {
  private readonly registry: client.Registry;

  private readonly uploadsCounter: client.Counter<string>;
  private readonly apiUsageCounter: client.Counter<string>;
  private readonly errorCounter: client.Counter<string>;
  //   private readonly activeUsersGauge: client.Gauge<string>;

  constructor() {
    this.registry = client.register;

    this.uploadsCounter =
      (this.registry.getSingleMetric(
        'uploads_total',
      ) as client.Counter<string>) ||
      new client.Counter({
        name: 'uploads_total',
        help: 'Number of uploads',
      });

    this.apiUsageCounter =
      (this.registry.getSingleMetric(
        'api_requests_total',
      ) as client.Counter<string>) ||
      new client.Counter({
        name: 'api_requests_total',
        help: 'Total API requests',
        labelNames: ['method', 'endpoint'],
      });

    this.errorCounter =
      (this.registry.getSingleMetric(
        'api_errors_total',
      ) as client.Counter<string>) ||
      new client.Counter({
        name: 'api_errors_total',
        help: 'Total API errors',
        labelNames: ['method', 'endpoint'],
      });

    // this.activeUsersGauge =
    //   (this.registry.getSingleMetric('active_users') as client.Gauge<string>) ||
    //   new client.Gauge({
    //     name: 'active_users',
    //     help: 'Number of active users',
    //   });

    this.registry.registerMetric(this.uploadsCounter);
    this.registry.registerMetric(this.apiUsageCounter);
    this.registry.registerMetric(this.errorCounter);
    // this.registry.registerMetric(this.activeUsersGauge);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  // Helpers to update metrics
  incrementUploads() {
    this.uploadsCounter.inc();
  }

  incrementApiUsage(method: string, endpoint: string) {
    this.apiUsageCounter.inc({ method, endpoint });
  }

  incrementError(method: string, endpoint: string) {
    this.errorCounter.inc({ method, endpoint });
  }

  //   setActiveUsers(count: number) {
  //     this.activeUsersGauge.set(count);
  //   }
}
