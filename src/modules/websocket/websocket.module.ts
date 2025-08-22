import { Module } from '@nestjs/common';
import { ActivityGateway } from './gateways/activity.gateway';
import { AdminGateway } from './gateways/admin.gateway';
import { WebSocketService } from './websocket.service';

@Module({
  providers: [WebSocketService, ActivityGateway, AdminGateway],
  exports: [WebSocketService], 
})
export class WebsocketModule {}