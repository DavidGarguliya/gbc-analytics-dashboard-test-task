import { pathToFileURL } from "node:url";

import {
  HIGH_VALUE_ORDER_ALERT_THRESHOLD,
  type HighValueOrderAlertsResult,
  runHighValueOrderAlerts,
} from "@/lib/telegram-alerts";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

export async function runTelegramHighValueAlertCheck(): Promise<HighValueOrderAlertsResult> {
  const supabase = createServiceRoleSupabaseClient();

  return runHighValueOrderAlerts(supabase);
}

export function logTelegramHighValueAlertCheckResult(
  result: HighValueOrderAlertsResult,
  logger: Pick<Console, "log"> = console,
) {
  logger.log("Telegram high-value alert check completed.");
  logger.log(`Threshold: > ${HIGH_VALUE_ORDER_ALERT_THRESHOLD} KZT`);
  logger.log(`Pending alerts found: ${result.pendingOrders}`);
  logger.log(`Alerts sent: ${result.sentAlerts}`);
  logger.log(
    `Alerted RetailCRM ids: ${result.alertedRetailCrmIds.length > 0 ? result.alertedRetailCrmIds.join(", ") : "none"}`,
  );
  logger.log(`Sent at: ${result.sentAt}`);
}

async function main() {
  const result = await runTelegramHighValueAlertCheck();

  logTelegramHighValueAlertCheckResult(result);
}

const isDirectExecution =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  main().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : "Unknown Telegram alert failure.";

    console.error("Telegram high-value alert check failed.");
    console.error(message);

    process.exitCode = 1;
  });
}
