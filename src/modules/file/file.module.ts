import { Module } from '@nestjs/common';
import { DrizzleModule } from 'src/database/drizzle.module';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [DrizzleModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
