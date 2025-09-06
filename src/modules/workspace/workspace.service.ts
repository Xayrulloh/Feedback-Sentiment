import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceQueryDto,
  WorkspaceResponseDto,
} from './dto/workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(createWorkspaceDto: CreateWorkspaceDto) {
    const [workspace] = await this.db
      .insert(schema.workspacesSchema)
      .values(createWorkspaceDto)
      .returning();

    return workspace;
  }

  async findAll(
    query: WorkspaceQueryDto,
    userId: string,
  ): Promise<WorkspaceResponseDto> {
    const { limit, page } = query;

    const totalResult = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schema.workspacesSchema);

    const total = totalResult[0]?.count ?? 0;

    const workspaces = await this.db.query.workspacesSchema.findMany({
      limit,
      offset: (page - 1) * limit,
      where: eq(schema.workspacesSchema.userId, userId),
      orderBy: desc(schema.workspacesSchema.createdAt),
    });

    return {
      workspaces,
      pagination: {
        limit,
        page,
        total: Number(total),
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    return this.db.query.workspacesSchema.findFirst({
      where: and(
        eq(schema.workspacesSchema.id, id),
        eq(schema.workspacesSchema.userId, userId),
      ),
    });
  }

  async update(
    id: string,
    userId: string,
    updateWorkspaceDto: UpdateWorkspaceDto,
  ) {
    const [workspace] = await this.db
      .update(schema.workspacesSchema)
      .set(updateWorkspaceDto)
      .where(
        and(
          eq(schema.workspacesSchema.id, id),
          eq(schema.workspacesSchema.userId, userId),
        ),
      )
      .returning();

    return workspace;
  }

  async remove(id: string, userId: string) {
    const [workspace] = await this.db
      .delete(schema.workspacesSchema)
      .where(
        and(
          eq(schema.workspacesSchema.id, id),
          eq(schema.workspacesSchema.userId, userId),
        ),
      )
      .returning();

    return workspace;
  }
}
