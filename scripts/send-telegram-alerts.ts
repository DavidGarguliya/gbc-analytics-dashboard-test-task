import {
  HIGH_VALUE_ORDER_ALERT_THRESHOLD,
  runHighValueOrderAlerts,
} from "@/lib/telegram-alerts";
import { createServiceRoleSupabaseClient } from "@/lib/supabase";

async function main() {
  const supabase = createServiceRoleSupabaseClient();
  const result = await runHighValueOrderAlerts(supabase);

  console.log("Telegram high-value alert check completed.");
  console.log(`Threshold: > ${HIGH_VALUE_ORDER_ALERT_THRESHOLD} KZT`);
  console.log(`Pending alerts found: ${result.pendingOrders}`);
  console.log(`Alerts sent: ${result.sentAlerts}`);
  console.log(
    `Alerted RetailCRM ids: ${result.alertedRetailCrmIds.length > 0 ? result.alertedRetailCrmIds.join(", ") : "none"}`,
  );
  console.log(`Sent at: ${result.sentAt}`);
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Unknown Telegram alert failure.";

  console.error("Telegram high-value alert check failed.");
  console.error(message);

  process.exitCode = 1;
});
