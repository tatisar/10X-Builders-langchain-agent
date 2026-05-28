import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ path: 'env.local' });

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1, 'OPENROUTER_API_KEY is required'),
  OPENROUTER_MODEL: z.string().default('openai/gpt-4o-mini'),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_TEMPERATURE: z.coerce.number().default(0),
  OPENROUTER_HTTP_REFERER: z.string().url().optional(),
  OPENROUTER_APP_TITLE: z.string().min(1).optional(),
  SEARCHAPI_API_KEY: z.string().min(1, 'SEARCHAPI_API_KEY is required'),
  SEARCHAPI_BASE_URL: z
    .string()
    .url()
    .default('https://www.searchapi.io/api/v1/search'),
  SEARCHAPI_HTTP_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(): AppEnv {
  return envSchema.parse(process.env);
}
