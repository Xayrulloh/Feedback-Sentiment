import { createZodDto } from 'nestjs-zod';
import { UserSchema } from 'src/utils/zod.schemas';

class UsersResponseSchemaDto extends createZodDto(UserSchema) {}

export { UsersResponseSchemaDto };
