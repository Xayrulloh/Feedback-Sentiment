import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [DrizzleModule],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
