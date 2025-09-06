import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';

@Module({
  controllers: [WorkspaceController],
  providers: [WorkspaceService],
  imports: [DrizzleModule],
})
export class WorkspaceModule {}
