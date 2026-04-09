import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatHighValueOrderAlert,
  sendHighValueOrderAlert,
  type TelegramHighValueOrder,
} from "@/lib/telegram";

const sampleOrder: TelegramHighValueOrder = {
  created_at: "2026-02-19T09:00:00.000Z",
  currency: "KZT",
  number: "MOCK-0050",
  retailcrm_id: 90,
  status: "offer-analog",
  total_sum: 81000,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("formatHighValueOrderAlert", () => {
  it("formats the stored order fields into a readable Telegram message", () => {
    expect(formatHighValueOrderAlert(sampleOrder)).toBe(
      [
        "High-value order detected",
        "Order: MOCK-0050",
        "RetailCRM ID: 90",
        "Amount: 81,000 KZT",
        "Status: offer-analog",
        "Created at: 2026-02-19 09:00:00 UTC",
      ].join("\n"),
    );
  });

  it("falls back to the RetailCRM id when the order number is absent", () => {
    expect(
      formatHighValueOrderAlert({
        ...sampleOrder,
        number: null,
      }),
    ).toContain("Order: #90");
  });
});

describe("sendHighValueOrderAlert", () => {
  it("sends a Telegram Bot API request with the formatted order text", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "telegram-token";
    process.env.TELEGRAM_CHAT_ID = "-100123456";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue("ok"),
    });

    await expect(sendHighValueOrderAlert(sampleOrder, fetchMock)).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.telegram.org/bottelegram-token/sendMessage",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: "-100123456",
          disable_notification: false,
          text: [
            "High-value order detected",
            "Order: MOCK-0050",
            "RetailCRM ID: 90",
            "Amount: 81,000 KZT",
            "Status: offer-analog",
            "Created at: 2026-02-19 09:00:00 UTC",
          ].join("\n"),
        }),
      },
    );
  });

  it("fails loudly when the Telegram API rejects the request", async () => {
    process.env.TELEGRAM_BOT_TOKEN = "telegram-token";
    process.env.TELEGRAM_CHAT_ID = "-100123456";
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("Unauthorized"),
    });

    await expect(sendHighValueOrderAlert(sampleOrder, fetchMock)).rejects.toThrow(
      "Telegram API request failed with status 401: Unauthorized",
    );
  });
});
