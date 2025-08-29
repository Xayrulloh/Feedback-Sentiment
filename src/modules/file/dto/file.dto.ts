import { createZodDto } from 'nestjs-zod';
import { FileSchema, PaginationSchema } from 'src/utils/zod.schemas';
import * as z from 'zod';

// TODO: describe
const FileResponseSchema = z.object({
  files: FileSchema.array(),
  pagination: PaginationSchema,
});

class FileResponseDto extends createZodDto(FileResponseSchema) {}

// TODO: describe
const FileQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

class FileQueryDto extends createZodDto(FileQuerySchema) {}

export { FileResponseDto, FileResponseSchema, FileQueryDto, FileQuerySchema };
