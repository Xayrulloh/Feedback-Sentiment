import { createZodDto } from 'nestjs-zod';
import { FileSchema, PaginationResponseSchema } from 'src/utils/zod.schemas';
import * as z from 'zod';

// ==================== Query ====================

const FileQuerySchema = z
  .object({
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
      .describe('Limit and Page number for pagination'),
  })
  .describe('Pagination page number');

// ==================== Response ====================

const FileResponseSchema = z
  .object({
    files: FileSchema.array().describe('List of files'),
    pagination: PaginationResponseSchema.describe('Pagination metadata'),
  })
  .describe('File response data with files and pagination data');

class FileResponseDto extends createZodDto(FileResponseSchema) {}
class FileQueryDto extends createZodDto(FileQuerySchema) {}

export { FileQuerySchema, FileQueryDto, FileResponseSchema, FileResponseDto };
