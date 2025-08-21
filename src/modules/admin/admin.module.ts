import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [DrizzleModule],
  providers: [AdminService],
  controllers: [AdminController],
})
export class AdminModule {}
