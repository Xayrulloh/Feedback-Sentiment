import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { RedisModule } from '../redis/redis.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [DrizzleModule, RedisModule, WebsocketModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}
