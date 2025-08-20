import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import type { UserSchemaType } from 'src/utils/zod.schemas';
import type { FileQueryDto, FileResponseDto } from './dto/file.dto';

@Injectable()
export class FileService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getUserFiles(
    query: FileQueryDto,
    user: UserSchemaType,
  ): Promise<FileResponseDto> {
    const { limit, page } = query;

    const whereConditions = [eq(schema.filesSchema.userId, user.id)];

    const totalResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schema.filesSchema)
      .where(and(...whereConditions));

    const total = totalResult[0]?.count ?? 0;

    const userFiles = await this.db
      .select()
      .from(schema.filesSchema)
      .where(and(...whereConditions))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      data: userFiles,
      pagination: {
        limit,
        page,
        total: Number(total),
        pages: Math.ceil(total / limit),
      },
    };
  }
}
