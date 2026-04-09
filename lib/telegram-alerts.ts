import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getUnalertedHighValueOrders,
  markAlertSent,
  type SupabaseHighValueOrderRow,
} from "@/lib/supabase";
import { sendHighValueOrderAlert } from "@/lib/telegram";

export const HIGH_VALUE_ORDER_ALERT_THRESHOLD = 50000;

export type PendingHighValueOrderAlert = SupabaseHighValueOrderRow;

export type HighValueOrderAlertsResult = {
  alertedRetailCrmIds: number[];
  pendingOrders: number;
  sentAlerts: number;
  sentAt: string;
  threshold: typeof HIGH_VALUE_ORDER_ALERT_THRESHOLD;
};

export async function sendPendingHighValueOrderAlerts(input: {
  markAlertSent: (input: { retailcrmId: number; sentAt: string }) => Promise<void>;
  pendingOrders: PendingHighValueOrderAlert[];
  sendAlert: (order: PendingHighValueOrderAlert) => Promise<void>;
  sentAt?: string;
}): Promise<HighValueOrderAlertsResult> {
  const sentAt = input.sentAt ?? new Date().toISOString();
  const alertedRetailCrmIds: number[] = [];

  for (const order of input.pendingOrders) {
    await input.sendAlert(order);
    await input.markAlertSent({
      retailcrmId: order.retailcrm_id,
      sentAt,
    });
    alertedRetailCrmIds.push(order.retailcrm_id);
  }

  return {
    alertedRetailCrmIds,
    pendingOrders: input.pendingOrders.length,
    sentAlerts: alertedRetailCrmIds.length,
    sentAt,
    threshold: HIGH_VALUE_ORDER_ALERT_THRESHOLD,
  };
}

export async function runHighValueOrderAlerts(
  client: SupabaseClient,
): Promise<HighValueOrderAlertsResult> {
  const sentAt = new Date().toISOString();
  const pendingOrders = await getUnalertedHighValueOrders(
    client,
    HIGH_VALUE_ORDER_ALERT_THRESHOLD,
  );

  return sendPendingHighValueOrderAlerts({
    pendingOrders,
    sentAt,
    sendAlert: sendHighValueOrderAlert,
    markAlertSent: async ({ retailcrmId, sentAt: recordedAt }) => {
      await markAlertSent(client, {
        retailcrmId,
        sentAt: recordedAt,
      });
    },
  });
}
