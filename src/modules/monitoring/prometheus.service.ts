import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class PrometheusService {
  private readonly logger = new Logger(PrometheusService.name);
  private readonly baseUrl = 'http://prometheus:9090/api/v1';

  async query(query: string) {
    try {
      const res = await axios.get(`${this.baseUrl}/query`, {
        params: { query },
      });

      return res.data.data.result;
    } catch (error) {
      this.logger.error(`Prometheus query failed: ${query}`, error.stack);

      throw new Error('Failed to fetch data from Prometheus');
    }
  }

  async getUploadsPerDay(): Promise<number> {
    const result = await this.query('sum(increase(uploads_total[1d]))');

    if (!result.length) {
      return 0;
    }

    return Math.round(Number(result[0].value[1]));
  }

  async getApiUsage() {
    const result = await this.query('sum(increase(api_requests_total[1d]))');

    if (!result.length) {
      return 0;
    }

    return Math.round(Number(result[0].value[1]));
  }

  async getErrorRates() {
    const result = await this.query('sum(increase(api_errors_total[1d]))');

    if (!result.length) {
      return 0;
    }

    return Math.round(Number(result[0].value[1]));
  }
}
