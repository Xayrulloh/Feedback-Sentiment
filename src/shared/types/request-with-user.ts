import { type Request } from 'express';
import { UserSchemaType } from 'src/utils/zod.schemas';

export type AuthenticatedRequest = Request & {
  user: UserSchemaType;
};
