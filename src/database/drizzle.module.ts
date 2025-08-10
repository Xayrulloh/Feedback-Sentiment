import { Module } from '@nestjs/common';
import { DrizzleAsyncProvider, drizzleProvider } from './drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';

@Module({
  providers: [...drizzleProvider, NodePgDatabase],
  exports: [DrizzleAsyncProvider, NodePgDatabase],
})
export class DrizzleModule {}
