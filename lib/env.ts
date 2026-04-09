export const requiredServerEnvKeys = [
  "RETAILCRM_BASE_URL",
  "RETAILCRM_API_KEY",
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "TELEGRAM_BOT_TOKEN",
  "TELEGRAM_CHAT_ID",
] as const;

export const requiredPublicEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_APP_URL",
] as const;

export type ServerEnvKey = (typeof requiredServerEnvKeys)[number];
export type PublicEnvKey = (typeof requiredPublicEnvKeys)[number];

export function readRequiredEnv(name: ServerEnvKey | PublicEnvKey): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
