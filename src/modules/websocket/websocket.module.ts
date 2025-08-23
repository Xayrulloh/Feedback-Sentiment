import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from 'src/database/drizzle.module';
import { SocketMiddleware } from './socket.middleware';
import { SocketGateway } from './websocket.gateaway';

@Module({
  providers: [SocketGateway, SocketMiddleware],
  exports: [SocketGateway],
  imports: [DrizzleModule, ConfigModule],
})
export class WebsocketModule {}
