import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getSupabaseBrowserConfig,
  getSupabaseServiceRoleConfig,
} from "@/lib/supabase";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getSupabaseBrowserConfig", () => {
  it("reads only the public Supabase configuration", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://public.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "public-anon-key";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(getSupabaseBrowserConfig()).toEqual({
      url: "https://public.supabase.co",
      anonKey: "public-anon-key",
    });
  });
});

describe("getSupabaseServiceRoleConfig", () => {
  it("reads the service-role configuration on the server", () => {
    process.env.SUPABASE_URL = "https://server.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(getSupabaseServiceRoleConfig()).toEqual({
      url: "https://server.supabase.co",
      serviceRoleKey: "service-role-key",
    });
  });

  it("rejects service-role access in a browser-like runtime", () => {
    vi.stubGlobal("window", {});
    process.env.SUPABASE_URL = "https://server.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

    expect(() => getSupabaseServiceRoleConfig()).toThrow(
      "Service-role Supabase access must stay on the server.",
    );
  });
});
