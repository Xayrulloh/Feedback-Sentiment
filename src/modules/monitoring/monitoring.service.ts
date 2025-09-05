import { Inject, Injectable } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MonitoringService {
  private readonly uploadCounter: client.Counter<string>;
  private readonly apiUsageCounter: client.Counter<string>;
  private readonly errorCounter: client.Counter<string>;

  constructor(
    @Inject('PROM_REGISTRY') private readonly registry: client.Registry,
  ) {
    this.uploadCounter = this.createCounter(
      'uploads_total',
      'Number of uploads',
    );

    this.apiUsageCounter = this.createCounter(
      'api_requests_total',
      'Total API requests',
      ['method', 'endpoint'],
    );

    this.errorCounter = this.createCounter(
      'api_errors_total',
      'Total API errors',
      ['method', 'endpoint', 'error_message'],
    );
  }

  private createCounter(
    name: string,
    help: string,
    labelNames: string[] = [],
  ): client.Counter<string> {
    let metric = this.registry.getSingleMetric(name) as client.Counter<string>;

    if (!metric) {
      metric = new client.Counter({ name, help, labelNames });
      this.registry.registerMetric(metric);
    }

    return metric;
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  incrementUploads() {
    this.uploadCounter.inc();
  }

  incrementApiUsage(labels: { method: string; endpoint: string }) {
    this.apiUsageCounter.inc(labels);
  }

  incrementError(labels: {
    method: string;
    endpoint: string;
    error_message: string;
  }) {
    this.errorCounter.inc(labels);
  }
}
