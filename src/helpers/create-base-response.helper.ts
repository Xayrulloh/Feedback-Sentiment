import { createZodDto } from 'nestjs-zod';
import { SuccessResponseSchema } from 'src/utils/zod.schemas';
import type * as z from 'zod';

export function createBaseResponseDto(schema: z.ZodTypeAny, name: string) {
  const responseSchema = SuccessResponseSchema(schema);
  const className = `${name}Dto`;

  const namedClass = {
    [className]: class extends createZodDto(responseSchema) {},
  };

  return namedClass[className];
}
