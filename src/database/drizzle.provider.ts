import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import type { EnvType } from 'src/config/env/env-validation';
import * as schema from './schema';

export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';

export const drizzleProvider = [
  {
    provide: DrizzleAsyncProvider,
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => {
      const connectionString = configService.get<EnvType['DATABASE_URL']>(
        'DATABASE_URL',
      ) as string; // FIXME: remove type assertion (connectionString type must be string not string and undefined)
      const pool = new Pool({
        connectionString,
      });

      Logger.log(`Database connected to ${process.env.DATABASE_URL}`);

      return drizzle(pool, { schema }) as NodePgDatabase<typeof schema>;
    },
  },
];
