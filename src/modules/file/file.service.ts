import {
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import { UserRoleEnum, type UserSchemaType } from 'src/utils/zod.schemas';
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
      files: userFiles,
      pagination: {
        limit,
        page,
        total: Number(total),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async deleteUserFile(fileId: string, user: UserSchemaType) {
    const [file] = await this.db
      .select()
      .from(schema.filesSchema)
      .where(eq(schema.filesSchema.id, fileId))
      .limit(1);

    if (!file) {
      throw new NotFoundException('File not found');
    }

    if (user.role === UserRoleEnum.USER && file.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to delete this file',
      );
    }

    const result = await this.db
      .delete(schema.filesSchema)
      .where(eq(schema.filesSchema.id, fileId));

    if ((result.rowCount ?? 0) === 0) {
      throw new InternalServerErrorException('Failed to delete file');
    }
  }
}
