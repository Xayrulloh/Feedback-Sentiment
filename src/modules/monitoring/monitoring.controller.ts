import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
// biome-ignore lint/style/useImportType: Needed for DI
import { MonitoringService } from './monitoring.service';

@Controller('metrics')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get()
  async getMetrics(@Res() res: Response) {
    res.set('Content-Type', 'text/plain');
    res.send(await this.monitoringService.getMetrics());
  }
}
