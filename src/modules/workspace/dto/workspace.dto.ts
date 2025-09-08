import { createZodDto } from 'nestjs-zod';
import {
  PaginationQuerySchema,
  PaginationResponseSchema,
  WorkspaceSchema,
} from 'src/utils/zod.schemas';
import z from 'zod';

const WorkspaceQuerySchema = PaginationQuerySchema.describe(
  'Workspace pagination query schema',
);

const WorkspaceRequestSchema = WorkspaceSchema.pick({
  name: true,
}).describe('Create or update workspace request schema');

const WorkspaceResponseSchema = WorkspaceSchema.describe(
  'Single workspace response data',
);

const WorkspacePaginatedResponseSchema = z
  .object({
    workspaces: WorkspaceSchema.array().describe('List of workspaces'),
    pagination: PaginationResponseSchema.optional().describe(
      'Pagination metadata',
    ),
  })
  .describe('Paginated workspaces response schema');

class WorkspaceQueryDto extends createZodDto(WorkspaceQuerySchema) {}
class WorkspaceRequestDto extends createZodDto(WorkspaceRequestSchema) {}
class WorkspacePaginatedResponseDto extends createZodDto(
  WorkspacePaginatedResponseSchema,
) {}
class WorkspaceResponseDto extends createZodDto(WorkspaceResponseSchema) {}

export {
  WorkspaceSchema,
  WorkspaceRequestSchema,
  WorkspaceRequestDto,
  WorkspaceQuerySchema,
  WorkspaceQueryDto,
  WorkspacePaginatedResponseSchema,
  WorkspacePaginatedResponseDto,
  WorkspaceResponseSchema,
  WorkspaceResponseDto,
};
