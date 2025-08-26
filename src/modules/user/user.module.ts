import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [DrizzleModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
