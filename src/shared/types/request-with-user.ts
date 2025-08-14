import { type Request } from 'express';
import { UserSchemaType } from 'src/utils/zod.schemas'; // FIXME: fix all imports

export type AuthenticatedRequest = Request & {
  user: UserSchemaType;
};
