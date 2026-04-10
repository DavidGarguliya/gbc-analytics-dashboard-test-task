import { readRequiredEnv } from "@/lib/env";
import {
  buildOperationalOrderSummary,
  formatOperationalOrderLabel,
  formatOrderMethod,
  splitOperationalItems,
} from "@/lib/order-operational";

export type TelegramHighValueOrder = {
  created_at: string;
  currency: string;
  customer_name: string | null;
  number: string | null;
  phone: string | null;
  raw_json: Record<string, unknown>;
  retailcrm_id: number;
  source: string | null;
  status: string | null;
  total_sum: number;
};

type FetchImplementation = typeof fetch;

function formatStoredAmount(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  })
    .format(value)
    .replace(/\u00A0/g, " ");
}

function formatStoredTimestamp(value: string): string {
  const date = new Date(value);
  const months = [
    "янв.",
    "февр.",
    "мар.",
    "апр.",
    "мая",
    "июн.",
    "июл.",
    "авг.",
    "сент.",
    "окт.",
    "нояб.",
    "дек.",
  ];

  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()} г., ${String(
    date.getUTCHours(),
  ).padStart(2, "0")}:${String(date.getUTCMinutes()).padStart(2, "0")}`;
}

function formatCountValue(value: number | null): string {
  if (value === null) {
    return "н/д";
  }

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}

export function formatHighValueOrderAlert(order: TelegramHighValueOrder): string {
  const summary = buildOperationalOrderSummary(order);
  const orderLabel = formatOperationalOrderLabel(summary);
  const visibleItems = splitOperationalItems(summary.items, 4);
  const itemLines =
    visibleItems.visibleItems.length > 0
      ? visibleItems.visibleItems.map(
          (item) => `• ${item.productName} ×${formatCountValue(item.quantity)}`,
        )
      : ["• Состав заказа не сохранён в read-model"];
  const additionalItemsLine =
    visibleItems.hiddenCount > 0 ? `+ ещё ${visibleItems.hiddenCount}` : null;

  return [
    "🛒 Новый крупный заказ!",
    "",
    `📦 Заказ: ${orderLabel}`,
    `💰 Сумма: ${formatStoredAmount(summary.totalSum)} ${summary.currency}`,
    `👤 Клиент: ${summary.customerName ?? "Не указан"}`,
    `📞 Телефон: ${summary.phone ?? "Не указан"}`,
    `✉️ Email: ${summary.email ?? "Не указан"}`,
    `🏙 Город: ${summary.city ?? "Не указан"}`,
    `📣 Источник: ${summary.marketingSource || "Не указан"}`,
    `🛒 Способ оформления: ${summary.orderMethod ? formatOrderMethod(summary.orderMethod) : "Не указан"}`,
    "🧾 Состав:",
    ...itemLines,
    ...(additionalItemsLine ? [additionalItemsLine] : []),
    "",
    `📊 Позиций: ${formatCountValue(summary.itemCount)} • Единиц товара: ${formatCountValue(summary.unitsCount)}`,
    `📅 Дата: ${formatStoredTimestamp(summary.createdAt)} UTC`,
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
