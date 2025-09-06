import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { RedisModule } from '../redis/redis.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  imports: [DrizzleModule, RedisModule, WebsocketModule],
})
export class WorkspaceModule {}
