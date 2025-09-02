import { Injectable, type NestMiddleware } from '@nestjs/common';
import { MonitoringService } from 'src/modules/monitoring/monitoring.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  private normalizeEndpoint(path: string): string {
    return path.replace(
      /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '/:id',
    );
  }

  use(req: Request, _res: Response, next: () => void) {
    const path = req.url.split('?')[0];
    const normalizedPath = this.normalizeEndpoint(path);

    this.monitoringService.incrementApiUsage({
      method: req.method,
      endpoint: normalizedPath,
    });

    if (path.startsWith('/api/feedback/upload')) {
      this.monitoringService.incrementUploads();
    }

    return next();
  }
}
