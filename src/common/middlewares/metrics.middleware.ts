import { Injectable, type NestMiddleware } from '@nestjs/common';
import { MonitoringService } from 'src/modules/monitoring/monitoring.service';

// Give proper Scopes to inject
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, _res: Response, next: () => void) {
    const path = req.url.split('?')[0];

    this.monitoringService.incrementApiUsage({
      method: req.method,
      endpoint: path,
    });

    if (path.startsWith('/api/feedback/upload')) {
      this.monitoringService.incrementUploads();
    }

    return next();
  }
}
