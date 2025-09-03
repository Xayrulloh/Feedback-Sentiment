import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  MISTRAL_API_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  PORT: z.string().length(4).transform(Number),
  JWT_SECRET: z.string().min(1),
  POSTGRES_USER: z.string().min(1),
  POSTGRES_PASSWORD: z.string().min(1),
  POSTGRES_DB: z.string().min(1),
  POSTGRES_PORT: z.string().min(1),
  REDIS_HOST: z.string().min(1),
  REDIS_PORT: z.string().length(4).transform(Number),
  REDIS_TTL: z.string().min(1).transform(Number),
});

type EnvType = z.infer<typeof envSchema>;

function validateEnv() {
  return envSchema.parse(process.env);
}

export { type EnvType, validateEnv, envSchema };
