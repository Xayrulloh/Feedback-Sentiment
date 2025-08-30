import { registerAs } from '@nestjs/config';
import { envSchema } from './env-validation';

export const env = registerAs('env', () => {
  return envSchema.parse(process.env);
});
