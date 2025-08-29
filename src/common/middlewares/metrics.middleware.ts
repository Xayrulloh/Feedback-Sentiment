import { Injectable, type NestMiddleware } from '@nestjs/common';
import { MonitoringService } from 'src/modules/monitoring/monitoring.service';

// Give proper Scopes to inject
@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, _res: Response, next: () => void) {
    const path = req.url.split('?')[0];

    this.monitoringService.incrementApiUsage(req.method, path);

    if (path.startsWith('/feedback/upload')) {
      this.monitoringService.incrementUploads();
    }

    return next();
  }
}
