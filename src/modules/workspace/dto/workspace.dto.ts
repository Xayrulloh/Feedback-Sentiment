import { createZodDto } from 'nestjs-zod';
import { PaginationResponseSchema } from 'src/utils/zod.schemas';
import z from 'zod';

const WorkspaceSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1).max(255),
    description: z.string().nullable(),
    userId: z.string().uuid().nullable().optional(),
    createdAt: z.date().optional(),
    updatedAt: z.date().optional(),
    deletedAt: z.date().nullable().optional(),
  })
  .describe('Workspace schema');

const WorkspaceQuerySchema = z
  .object({
    limit: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .default(20)
      .describe('Number of workspaces to fetch per page'),
    page: z.coerce
      .number()
      .int()
      .min(1)
      .default(1)
      .describe('Page number for pagination'),
  })
  .describe('Workspace Query schema');

const WorkspaceResponseSchema = z
  .object({
    workspaces: WorkspaceSchema.array().describe('List of users'),
    pagination: PaginationResponseSchema.optional().describe(
      'Pagination metadata',
    ),
  })
  .describe('Users response data with pagination');

class CreateWorkspaceDto extends createZodDto(WorkspaceSchema) {}
class UpdateWorkspaceDto extends createZodDto(WorkspaceSchema) {}
class WorkspaceQueryDto extends createZodDto(WorkspaceQuerySchema) {}
class WorkspaceResponseDto extends createZodDto(WorkspaceResponseSchema) {}

export {
  WorkspaceSchema,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceQuerySchema,
  WorkspaceQueryDto,
  WorkspaceResponseSchema,
  WorkspaceResponseDto,
};
