import {
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ZodValidationPipe } from 'nestjs-zod';
import { HttpExceptionFilter } from './common/filters/http.exception.filter';
import { ZodExceptionFilter } from './common/filters/zod.exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { ZodSerializerInterceptorCustom } from './common/interceptors/zod.response-checker.interceptor';
import { AdminMiddleware } from './common/middlewares/admin.middleware';
import { MetricsMiddleware } from './common/middlewares/metrics.middleware';
import { EnvModule } from './config/env/env.module';
import { DrizzleModule } from './database/drizzle.module';
import { AiModule } from './modules/AI/AI.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { FeedbackModule } from './modules/feedback/feedback.module';
import { FileModule } from './modules/file/file.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { UserModule } from './modules/user/user.module';
@Module({
  imports: [
    EnvModule,
    AuthModule,
    AiModule,
    FeedbackModule,
    AdminModule,
    FileModule,
    DrizzleModule,
    PrometheusModule.register(),
    MonitoringModule,
    UserModule,
  ],

  controllers: [],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_FILTER, useClass: ZodExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptorCustom },
    AdminMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(MetricsMiddleware)
      .exclude(
        { path: 'metrics', method: RequestMethod.ALL },
        { path: 'admin/monitoring', method: RequestMethod.ALL },
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    consumer.apply(AdminMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
