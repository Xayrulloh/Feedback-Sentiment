// FIXME: all decorators should be in common folder
import { SetMetadata } from '@nestjs/common';
import type { UserRoleEnum } from 'src/utils/zod.schemas';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRoleEnum[]) =>
  SetMetadata(ROLES_KEY, roles);
