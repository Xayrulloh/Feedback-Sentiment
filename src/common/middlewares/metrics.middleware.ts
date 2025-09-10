import { Injectable, type NestMiddleware } from '@nestjs/common';
import { normalizeEndpoint } from 'src/helpers/normalize-endpoint.helper';
import { MonitoringService } from 'src/modules/monitoring/monitoring.service';
import { GLOBAL_PREFIX } from 'src/utils/constants';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, _res: Response, next: () => void) {
    const path = req.url.split('?')[0];

    if (!path.startsWith(GLOBAL_PREFIX)) {
      return next();
    }

    const normalizedPath = normalizeEndpoint(path);

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
