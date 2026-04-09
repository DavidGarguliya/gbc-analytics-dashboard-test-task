import { describe, expect, it } from "vitest";

import { readRequiredEnv } from "@/lib/env";

describe("readRequiredEnv", () => {
  it("returns a populated environment variable", () => {
    process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";

    expect(readRequiredEnv("NEXT_PUBLIC_APP_URL")).toBe("http://localhost:3000");
  });

  it("throws when the environment variable is missing", () => {
    delete process.env.RETAILCRM_API_KEY;

    expect(() => readRequiredEnv("RETAILCRM_API_KEY")).toThrow(
      "Missing required environment variable: RETAILCRM_API_KEY",
    );
  });
});
