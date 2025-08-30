import { createZodDto } from 'nestjs-zod';
import type * as z from 'zod';
import {
  type BaseErrorResponseSchemaType,
  type ErrorDetailsSchemaType,
  SuccessResponseSchema,
} from './zod.schemas';

export function createBaseErrorResponse(
  statusCode: number,
  message: string,
  errors: ErrorDetailsSchemaType[] | null | undefined,
  path: string,
): BaseErrorResponseSchemaType & { errors?: ErrorDetailsSchemaType[] } {
  return {
    success: false,
    statusCode,
    message,
    ...(errors && errors.length > 0 ? { errors } : {}),
    timestamp: new Date().toISOString(),
    path,
  };
}

export function createBaseResponseDto(schema: z.ZodTypeAny, name: string) {
  const responseSchema = SuccessResponseSchema(schema);
  const className = `${name}Dto`;

  const namedClass = {
    [className]: class extends createZodDto(responseSchema) {},
  };

  return namedClass[className];
}
