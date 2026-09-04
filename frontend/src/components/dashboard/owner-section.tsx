"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useMemo, useState } from "react";
import { visuallyHidden } from "@/lib/visually-hidden";

import { theme } from "@/theme";

import { PositionCards } from "./position-cards";
import { PositionTable } from "./position-table";
import { sortStocks } from "./sort";
import type { DashboardBrokerage, DashboardOwner, SortDirection, SortField } from "./types";

const sortLabels: Readonly<Record<SortField, string>> = {
  stockName: "종목명",
  quantity: "보유 수량",
  averageBuyPrice: "매수평균단가",
  totalBuyAmount: "매입액",
  brokerageWeight: "증권사 비중",
  currentPrice: "현재가",
  unrealizedProfit: "평가 손익",
  valuation: "평가액",
  returnRate: "수익률",
};

type OwnerSectionProps = Readonly<{
  owner: DashboardOwner;
  ownerIndex: number;
  showBrokerageTotals: boolean;
}>;

function sortedBrokerages(
  brokerages: readonly DashboardBrokerage[],
  sortField: SortField,
  sortDirection: SortDirection,
): readonly DashboardBrokerage[] {
  return brokerages.map((brokerage) => ({
    ...brokerage,
    stocks: sortStocks(brokerage.stocks, sortField, sortDirection),
  }));
}

export function OwnerSection({ owner, ownerIndex, showBrokerageTotals }: OwnerSectionProps) {
  const [sortField, setSortField] = useState<SortField>("totalBuyAmount");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const sorted = useMemo(
    () => sortedBrokerages(owner.brokerages, sortField, sortDirection),
    [owner.brokerages, sortDirection, sortField],
  );
  const headingId = `owner-${owner.ownerId}`;
  const ownerColor = theme.palette.owner[ownerIndex % theme.palette.owner.length];

  function sortFromHeader(field: SortField) {
    if (field === sortField) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("desc");
  }

  return (
    <Card
      component="section"
      aria-labelledby={headingId}
      data-owner={owner.ownerName}
      variant="outlined"
    >
      <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
        <Stack direction="row" sx={{ alignItems: "center", gap: 2.5, mb: 4 }}>
          <Box
            aria-hidden="true"
            sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: ownerColor, flexShrink: 0 }}
          />
          <Box>
            <Typography
              component="p"
              sx={{ fontWeight: 800, letterSpacing: "0.04em", color: "text.secondary" }}
              variant="body2"
            >
              소유주
            </Typography>
            <Typography component="h2" id={headingId} variant="h2">
              {owner.ownerName}
            </Typography>
            <Typography sx={{ mt: 0.5, color: "text.secondary" }} variant="body2">
              {owner.brokerages.length}개 증권사, {owner.stockCount}개 종목 보유
            </Typography>
          </Box>
        </Stack>

        <p aria-live="polite" style={visuallyHidden}>
          {owner.ownerName} 목록을 {sortLabels[sortField]}{" "}
          {sortDirection === "asc" ? "오름차순" : "내림차순"}으로 정렬했습니다.
        </p>

        {owner.stockCount === 0 ? (
          <Stack
            direction={{ xs: "column", sm: "row" }}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              justifyContent: "space-between",
              gap: 3,
              minHeight: 112,
              p: 4,
              borderRadius: 2,
              bgcolor: "action.hover",
            }}
          >
            <Typography sx={{ m: 0, color: "text.secondary" }}>
              현재 보유 중인 종목이 없습니다.
            </Typography>
            <Button component={Link} href="/record" variant="outlined">
              매수 기록 추가
            </Button>
          </Stack>
        ) : (
          <>
            <PositionTable
              brokerages={sorted}
              onSort={sortFromHeader}
              owner={owner}
              showBrokerageTotals={showBrokerageTotals}
              sortDirection={sortDirection}
              sortField={sortField}
            />
            <PositionCards
              brokerages={sorted}
              owner={owner}
              showBrokerageTotals={showBrokerageTotals}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
