import type {
  BaseErrorResponseSchemaType,
  ErrorDetailsSchemaType,
} from 'src/utils/zod.schemas';

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
