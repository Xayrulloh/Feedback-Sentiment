import { createZodDto } from 'nestjs-zod';
import {
  PaginationResponseSchema,
  WorkspaceSchema,
} from 'src/utils/zod.schemas';
import z from 'zod';

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

const WorkspaceRequestSchema = WorkspaceSchema.pick({
  name: true,
  description: true,
});

const WorkspaceSingleResponseSchema = WorkspaceSchema.describe(
  'Single workspace response data',
);

const WorkspaceResponseSchema = z
  .object({
    workspaces: WorkspaceSchema.array().describe('List of users'),
    pagination: PaginationResponseSchema.optional().describe(
      'Pagination metadata',
    ),
  })
  .describe('Users response data with pagination');

class WorkspaceQueryDto extends createZodDto(WorkspaceQuerySchema) {}
class WorkspaceRequestDto extends createZodDto(WorkspaceRequestSchema) {}
class WorkspaceResponseDto extends createZodDto(WorkspaceResponseSchema) {}
class WorkspaceSingleResponseDto extends createZodDto(
  WorkspaceSingleResponseSchema,
) {}

export {
  WorkspaceSchema,
  WorkspaceRequestSchema,
  WorkspaceRequestDto,
  WorkspaceQuerySchema,
  WorkspaceQueryDto,
  WorkspaceResponseSchema,
  WorkspaceResponseDto,
  WorkspaceSingleResponseSchema,
  WorkspaceSingleResponseDto,
};
