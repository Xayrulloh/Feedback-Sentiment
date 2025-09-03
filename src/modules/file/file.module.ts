import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { RedisModule } from '../redis/redis.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [DrizzleModule, RedisModule, WebsocketModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
