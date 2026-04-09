import { describe, expect, it, vi } from "vitest";

import {
  HIGH_VALUE_ORDER_ALERT_THRESHOLD,
  sendPendingHighValueOrderAlerts,
  type PendingHighValueOrderAlert,
} from "@/lib/telegram-alerts";

const pendingOrders: PendingHighValueOrderAlert[] = [
  {
    created_at: "2026-02-19T09:00:00.000Z",
    currency: "KZT",
    number: "MOCK-0050",
    retailcrm_id: 90,
    status: "offer-analog",
    total_sum: 81000,
  },
  {
    created_at: "2026-02-20T10:30:00.000Z",
    currency: "KZT",
    number: "MOCK-0051",
    retailcrm_id: 91,
    status: "new",
    total_sum: 91000,
  },
];

describe("sendPendingHighValueOrderAlerts", () => {
  it("sends each pending alert and records the dedupe marker after success", async () => {
    const markAlertSent = vi.fn().mockResolvedValue(undefined);
    const sendAlert = vi.fn().mockResolvedValue(undefined);

    await expect(
      sendPendingHighValueOrderAlerts({
        pendingOrders,
        sendAlert,
        markAlertSent,
        sentAt: "2026-04-10T16:00:00.000Z",
      }),
    ).resolves.toEqual({
      alertedRetailCrmIds: [90, 91],
      pendingOrders: 2,
      sentAlerts: 2,
      sentAt: "2026-04-10T16:00:00.000Z",
      threshold: HIGH_VALUE_ORDER_ALERT_THRESHOLD,
    });

    expect(sendAlert).toHaveBeenNthCalledWith(1, pendingOrders[0]);
    expect(sendAlert).toHaveBeenNthCalledWith(2, pendingOrders[1]);
    expect(markAlertSent).toHaveBeenNthCalledWith(1, {
      retailcrmId: 90,
      sentAt: "2026-04-10T16:00:00.000Z",
    });
    expect(markAlertSent).toHaveBeenNthCalledWith(2, {
      retailcrmId: 91,
      sentAt: "2026-04-10T16:00:00.000Z",
    });
  });

  it("does nothing when no pending orders remain", async () => {
    const markAlertSent = vi.fn().mockResolvedValue(undefined);
    const sendAlert = vi.fn().mockResolvedValue(undefined);

    await expect(
      sendPendingHighValueOrderAlerts({
        pendingOrders: [],
        sendAlert,
        markAlertSent,
        sentAt: "2026-04-10T16:00:00.000Z",
      }),
    ).resolves.toEqual({
      alertedRetailCrmIds: [],
      pendingOrders: 0,
      sentAlerts: 0,
      sentAt: "2026-04-10T16:00:00.000Z",
      threshold: HIGH_VALUE_ORDER_ALERT_THRESHOLD,
    });

    expect(sendAlert).not.toHaveBeenCalled();
    expect(markAlertSent).not.toHaveBeenCalled();
  });

  it("does not persist a dedupe marker when message sending fails", async () => {
    const markAlertSent = vi.fn().mockResolvedValue(undefined);
    const sendAlert = vi.fn().mockRejectedValue(new Error("Telegram unavailable"));

    await expect(
      sendPendingHighValueOrderAlerts({
        pendingOrders: [pendingOrders[0]],
        sendAlert,
        markAlertSent,
        sentAt: "2026-04-10T16:00:00.000Z",
      }),
    ).rejects.toThrow("Telegram unavailable");

    expect(markAlertSent).not.toHaveBeenCalled();
  });
});
