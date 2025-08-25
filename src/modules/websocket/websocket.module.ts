import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DrizzleModule } from 'src/database/drizzle.module';
import { SocketMiddleware } from './socket.middleware';
import { SocketGateway } from './websocket.gateaway';

@Module({
  imports: [DrizzleModule, ConfigModule],
  providers: [SocketGateway, SocketMiddleware],
  exports: [SocketGateway],
})
export class WebsocketModule {}
