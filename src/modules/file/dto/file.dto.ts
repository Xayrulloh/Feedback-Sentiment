import { createZodDto } from 'nestjs-zod';
import { FileSchema, PaginationSchema } from 'src/utils/zod.schemas';
import * as z from 'zod';

// ==================== Query ====================

/**
 * Query parameters for fetching files with pagination
 */
const FileQuerySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .describe('Number of files to fetch per page'),
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
    .describe('Page number for pagination'),
});

class FileQueryDto extends createZodDto(FileQuerySchema) {}

// ==================== Response ====================

/**
 * Response DTO containing a paginated list of files
 */
const FileResponseSchema = z.object({
  files: FileSchema.array().describe('List of files'),
  pagination: PaginationSchema.describe('Pagination metadata'),
});

class FileResponseDto extends createZodDto(FileResponseSchema) {}

// ==================== Exports ====================

export {
  // Query
  FileQuerySchema,
  FileQueryDto,
  // Response
  FileResponseSchema,
  FileResponseDto,
};
