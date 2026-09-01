import "server-only";

import { z } from "zod";

import { type DashboardResponse, dashboardResponseSchema } from "@/components/dashboard/types";
import type { Brokerage, Owner } from "@/lib/api-contracts";

import { getInternalApiData } from "./internal-api";

const financeNumberSchema = z.number().finite();
const ownerIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const ownerSchema = z.strictObject({
  id: ownerIdSchema,
  name: z.string().trim().min(1),
});
const brokerageSchema = z.strictObject({
  code: z.string().regex(/^\d{3}$/),
  name: z.string().min(1),
});
const historyRowSchema = z
  .strictObject({
    amount: financeNumberSchema,
    brokerageCode: z.string().regex(/^\d{3}$/),
    brokerageName: z.string().min(1),
    executedAt: z.string().min(1),
    id: z.number().int().positive(),
    isEtf: z.boolean(),
    stockCode: z.string().regex(/^[0-9A-Z]{6}$/),
    market: z.string().min(1),
    ownerId: ownerIdSchema,
    ownerName: z.string().min(1),
    quantity: financeNumberSchema,
    realizedProfit: financeNumberSchema.nullable(),
    stockName: z.string().min(1),
    unitPrice: financeNumberSchema,
  })
  .transform(({ realizedProfit, id, amount, quantity, unitPrice, ...row }) => ({
    ...row,
    id: id.toString(),
    amount: amount.toString(),
    quantity: quantity.toString(),
    unitPrice: unitPrice.toString(),
    profit: realizedProfit === null ? null : realizedProfit.toString(),
  }));
const historySchema = z
  .strictObject({
    count: z.number().int().nonnegative(),
    currentPage: z.number().int().positive(),
    hasFilters: z.boolean(),
    totalCount: z.number().int().nonnegative(),
    totalPages: z.number().int().positive(),
    tradeHistoryRowResponseDtos: z.array(historyRowSchema),
  })
  .transform((data) => ({
    count: data.count,
    currentPage: data.currentPage,
    hasFilters: data.hasFilters,
    rows: data.tradeHistoryRowResponseDtos,
    total: data.totalCount,
    totalPages: data.totalPages,
  }));
const purchasedStockSchema = z.strictObject({
  code: z.string().regex(/^[0-9A-Z]{6}$/),
  isEtf: z.boolean(),
  market: z.string().min(1),
  name: z.string().min(1),
});

export type TradeHistoryResult = z.infer<typeof historySchema>;
export type PurchasedStock = z.infer<typeof purchasedStockSchema>;

export function listBrokerages(): Promise<readonly Brokerage[]> {
  return getInternalApiData("brokerages", z.array(brokerageSchema));
}

export function listOwners(): Promise<readonly Owner[]> {
  return getInternalApiData("owners", z.array(ownerSchema));
}

export function listFavoriteBrokerages(ownerId: number): Promise<readonly Brokerage[]> {
  return getInternalApiData(`owners/${ownerId}/brokerages`, z.array(brokerageSchema));
}

export async function listFavoriteBrokeragesByOwner(
  owners: readonly Owner[],
): Promise<Readonly<Record<string, readonly Brokerage[]>>> {
  const entries = await Promise.all(
    owners.map(
      async (owner) => [owner.id.toString(), await listFavoriteBrokerages(owner.id)] as const,
    ),
  );
  return Object.fromEntries(entries);
}

export function getDashboard(): Promise<DashboardResponse> {
  return getInternalApiData("dashboard", dashboardResponseSchema);
}

const DEFAULT_PAGE_SIZE = 25;

const seoulDayStart = (date: string): string => `${date}T00:00:00+09:00`;

const seoulNextDayStart = (date: string): string => {
  const [year = 0, month = 0, day = 0] = date.split("-").map(Number);
  const nextDay = new Date(Date.UTC(year, month - 1, day + 1));
  const iso = nextDay.toISOString().slice(0, 10);
  return seoulDayStart(iso);
};

export function listTradeHistory(
  side: "BUY" | "SELL",
  rawSearchParams: Readonly<Record<string, string | string[] | undefined>>,
): Promise<TradeHistoryResult> {
  const searchParams = new URLSearchParams({
    side,
    page: "1",
    pageSize: String(DEFAULT_PAGE_SIZE),
  });
  for (const key of ["stockNameOrCode", "ownerId", "brokerageCode", "page"] as const) {
    const value = rawSearchParams[key];
    if (typeof value === "string") searchParams.set(key, value);
  }
  const from = rawSearchParams.from;
  if (typeof from === "string" && from) searchParams.set("from", seoulDayStart(from));
  const to = rawSearchParams.to;
  if (typeof to === "string" && to) searchParams.set("to", seoulNextDayStart(to));
  return getInternalApiData("history/trades", historySchema, searchParams);
}

export function listPurchasedStocks(tradeType: "BUY" | "SELL"): Promise<readonly PurchasedStock[]> {
  return getInternalApiData(
    "history/stocks",
    z.array(purchasedStockSchema),
    new URLSearchParams({ tradeType }),
  );
}
