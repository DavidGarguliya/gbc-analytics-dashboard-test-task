import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { readRequiredEnv } from "@/lib/env";

export type SupabaseBrowserConfig = {
  anonKey: string;
  url: string;
};

export type SupabaseServiceRoleConfig = {
  serviceRoleKey: string;
  url: string;
};

function assertServerRuntime() {
  if (typeof window !== "undefined") {
    throw new Error("Service-role Supabase access must stay on the server.");
  }
}

export function getSupabaseBrowserConfig(): SupabaseBrowserConfig {
  return {
    url: readRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    anonKey: readRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  };
}

export function getSupabaseServiceRoleConfig(): SupabaseServiceRoleConfig {
  assertServerRuntime();

  return {
    url: readRequiredEnv("SUPABASE_URL"),
    serviceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function createBrowserSupabaseClient(): SupabaseClient {
  const config = getSupabaseBrowserConfig();

  return createClient(config.url, config.anonKey);
}

export function createServiceRoleSupabaseClient(): SupabaseClient {
  const config = getSupabaseServiceRoleConfig();

  return createClient(config.url, config.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
