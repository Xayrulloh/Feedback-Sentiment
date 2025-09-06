import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from 'src/database/drizzle.provider';
import * as schema from 'src/database/schema';
import {
  WorkspaceQueryDto,
  WorkspaceRequestDto,
  WorkspaceResponseDto,
  WorkspaceSingleResponseDto,
} from './dto/workspace.dto';

@Injectable()
export class WorkspaceService {
  constructor(
    @Inject(DrizzleAsyncProvider)
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async create(
    workspaceRequestDto: WorkspaceRequestDto,
    userId: string,
  ): Promise<WorkspaceSingleResponseDto> {
    const [workspace] = await this.db
      .insert(schema.workspacesSchema)
      .values({
        ...workspaceRequestDto,
        userId,
      })
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

  async findOne(
    id: string,
    userId: string,
  ): Promise<WorkspaceSingleResponseDto> {
    const workspace = await this.db.query.workspacesSchema.findFirst({
      where: and(
        eq(schema.workspacesSchema.id, id),
        eq(schema.workspacesSchema.userId, userId),
      ),
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with id: ${id} not found`);
    }

    return workspace;
  }

  async update(
    id: string,
    userId: string,
    workspaceRequestDto: WorkspaceRequestDto,
  ): Promise<WorkspaceSingleResponseDto> {
    const [workspace] = await this.db
      .update(schema.workspacesSchema)
      .set(workspaceRequestDto)
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
    const workspace = await this.db.query.workspacesSchema.findFirst({
      where: and(
        eq(schema.workspacesSchema.id, id),
        eq(schema.workspacesSchema.userId, userId),
      ),
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    await this.db
      .delete(schema.workspacesSchema)
      .where(eq(schema.workspacesSchema.id, id));
  }
}
