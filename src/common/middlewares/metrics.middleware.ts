import { Injectable, type NestMiddleware } from '@nestjs/common';
// biome-ignore lint/style/useImportType: Needed for DI
import { MonitoringService } from 'src/modules/monitoring/monitoring.service';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, _res: Response, next: () => void) {
    const path = req.url.split('?')[0];

    this.monitoringService.incrementApiUsage(req.method, path);

    if (path.startsWith('/feedback/upload')) {
      this.monitoringService.incrementUploads();
    }

    next();
  }
}
