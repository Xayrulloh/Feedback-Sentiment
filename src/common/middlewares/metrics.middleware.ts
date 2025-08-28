import { Injectable, type NestMiddleware } from '@nestjs/common';
// FIXME: Research to fix this, instead of using every time we need better solution
// biome-ignore lint/style/useImportType: Needed for DI
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

    // FIXME: put return
    next();
  }
}
