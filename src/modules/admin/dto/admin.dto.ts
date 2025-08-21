import { createZodDto } from 'nestjs-zod';
import { UserSchema } from 'src/utils/zod.schemas';
import type z from 'zod';

const AdminDisableSuspendResponseSchema = UserSchema.describe(
  'Response schema for admin disable/suspend operations',
);

class AdminDisableSuspendResponseDto extends createZodDto(
  AdminDisableSuspendResponseSchema,
) {}

type AdminDisableSuspendResponseSchemaType = z.infer<
  typeof AdminDisableSuspendResponseSchema
>;

export {
  AdminDisableSuspendResponseSchema,
  AdminDisableSuspendResponseDto,
  type AdminDisableSuspendResponseSchemaType,
};
