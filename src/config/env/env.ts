import { registerAs } from '@nestjs/config';
import { envSchema } from './env-validation';

export const env = registerAs('env', () => {
  // TODO: let's just return without creating variable
  const parsed = envSchema.parse(process.env);

  return parsed;
});
