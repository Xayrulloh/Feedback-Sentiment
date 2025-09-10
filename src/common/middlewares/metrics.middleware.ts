import { Injectable, type NestMiddleware } from '@nestjs/common';
import { MonitoringService } from 'src/modules/monitoring/monitoring.service';
import { GLOBAL_PREFIX } from 'src/utils/constants';

@Injectable()
export class MetricsMiddleware implements NestMiddleware {
  constructor(private readonly monitoringService: MonitoringService) {}

  use(req: Request, _res: Response, next: () => void) {
    const path = req.url.split('?')[0];

    if (!path.startsWith(`/${GLOBAL_PREFIX}`)) {
      return next();
    }

    if (/\/feedbacks\/upload\/?$/.test(path)) {
      this.monitoringService.incrementUploads();
      this.monitoringService.incrementApiUsage();
    } else {
      this.monitoringService.incrementApiUsage();
    }

    return next();
  }
}
