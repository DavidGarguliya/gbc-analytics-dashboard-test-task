import { readRequiredEnv } from "@/lib/env";

export type TelegramHighValueOrder = {
  created_at: string;
  currency: string;
  number: string | null;
  retailcrm_id: number;
  status: string | null;
  total_sum: number;
};

type FetchImplementation = typeof fetch;

function formatStoredAmount(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

function formatStoredTimestamp(value: string): string {
  const isoValue = new Date(value).toISOString();

  return `${isoValue.slice(0, 19).replace("T", " ")} UTC`;
}

export function formatHighValueOrderAlert(order: TelegramHighValueOrder): string {
  const orderLabel = order.number?.trim() ? order.number.trim() : `#${order.retailcrm_id}`;

  return [
    "High-value order detected",
    `Order: ${orderLabel}`,
    `RetailCRM ID: ${order.retailcrm_id}`,
    `Amount: ${formatStoredAmount(order.total_sum)} ${order.currency}`,
    `Status: ${order.status ?? "Unspecified"}`,
    `Created at: ${formatStoredTimestamp(order.created_at)}`,
  ].join("\n");
}

export async function sendHighValueOrderAlert(
  order: TelegramHighValueOrder,
  fetchImplementation: FetchImplementation = fetch,
): Promise<void> {
  const botToken = readRequiredEnv("TELEGRAM_BOT_TOKEN");
  const chatId = readRequiredEnv("TELEGRAM_CHAT_ID");
  const response = await fetchImplementation(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        disable_notification: false,
        text: formatHighValueOrderAlert(order),
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Telegram API request failed with status ${response.status}: ${errorText || "Unknown Telegram error"}`,
    );
  }
}
