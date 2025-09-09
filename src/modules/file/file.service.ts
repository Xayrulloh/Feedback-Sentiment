import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
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

  async getFile(
    query: FileQueryDto,
    user: UserSchemaType,
    workspaceId?: string,
  ): Promise<FileResponseDto> {
    const { limit, page } = query;

    const totalResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schema.filesSchema)
      .where(
        workspaceId
          ? eq(schema.filesSchema.workspaceId, workspaceId)
          : eq(schema.filesSchema.userId, user.id),
      );

    const total = totalResult[0]?.count ?? 0;

    const userFiles = await this.db.query.filesSchema.findMany({
      where: workspaceId
        ? eq(schema.filesSchema.workspaceId, workspaceId)
        : eq(schema.filesSchema.userId, user.id),
      limit,
      offset: (page - 1) * limit,
      orderBy: desc(schema.filesSchema.createdAt),
    });

    return {
      files: userFiles,
      pagination: {
        limit,
        page,
        total: Number(total),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async fileDelete(fileId: string, user: UserSchemaType) {
    const file = await this.db.query.filesSchema.findFirst({
      where: and(
        eq(schema.filesSchema.id, fileId),
        eq(schema.filesSchema.userId, user.id),
      ),
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    await this.db
      .delete(schema.filesSchema)
      .where(eq(schema.filesSchema.id, fileId));
  }
}
