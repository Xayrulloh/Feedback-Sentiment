import { Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MonitoringService {
  private readonly registry: client.Registry;
  private readonly uploadCounter: client.Counter<string>;
  private readonly apiUsageCounter: client.Counter<string>;
  private readonly errorCounter: client.Counter<string>;

  constructor() {
    this.registry = client.register;

    this.uploadCounter =
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
        labelNames: ['method', 'endpoint', 'error_message'],
      });

    this.registry.registerMetric(this.uploadCounter);
    this.registry.registerMetric(this.apiUsageCounter);
    this.registry.registerMetric(this.errorCounter);
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  incrementUploads() {
    this.uploadCounter.inc();
  }

  incrementApiUsage(method: string, endpoint: string) {
    this.apiUsageCounter.inc({ method, endpoint });
  }

  incrementError(method: string, endpoint: string, errorMessage: string) {
    this.errorCounter.inc({ method, endpoint, error_message: errorMessage });
  }
}
