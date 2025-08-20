import { createZodDto } from 'nestjs-zod';
import { FileSchema, PaginationSchema } from 'src/utils/zod.schemas';
import * as z from 'zod';

const FileResponseSchema = z.object({
  data: FileSchema.array(),
  pagination: PaginationSchema,
});

class FileResponseDto extends createZodDto(FileResponseSchema) {}

const FileQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  page: z.coerce.number().int().min(1).default(1),
});

class FileQueryDto extends createZodDto(FileQuerySchema) {}

export { FileResponseDto, FileResponseSchema, FileQueryDto, FileQuerySchema };
