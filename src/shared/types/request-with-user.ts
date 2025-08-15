import type { Request } from 'express';
import type { UserSchemaType } from 'src/utils/zod.schemas';

export type AuthenticatedRequest = Request & {
  user: UserSchemaType;
};
