"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { PageContainer } from "@/components/page-container";

import { SHOW_BROKERAGE_TOTALS_COOKIE } from "./brokerage-totals-cookie";
import { OwnerSection } from "./owner-section";
import { StockSummarySection } from "./stock-summary-section";
import { SummaryStrip } from "./summary-strip";
import type { DashboardResponse } from "./types";

type DashboardViewProps = Readonly<{
  dashboard: DashboardResponse;
  initialShowBrokerageTotals: boolean;
}>;

const SHOW_BROKERAGE_TOTALS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function DashboardView({ dashboard, initialShowBrokerageTotals }: DashboardViewProps) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [showBrokerageTotals, setShowBrokerageTotals] = useState(initialShowBrokerageTotals);
  const isEmpty = dashboard.stockCount === 0;

  function refreshPrices() {
    startRefresh(() => router.refresh());
  }

  function toggleBrokerageTotals() {
    setShowBrokerageTotals((current) => {
      const next = !current;
      // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API isn't supported in every browser yet.
      document.cookie = `${SHOW_BROKERAGE_TOTALS_COOKIE}=${next}; path=/; max-age=${SHOW_BROKERAGE_TOTALS_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
      return next;
    });
  }

  return (
    <PageContainer stack>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          alignItems: { xs: "stretch", sm: "flex-end" },
          justifyContent: "space-between",
          gap: 4,
        }}
      >
        <Typography component="h1" variant="h1">
          대시보드
        </Typography>
        <Stack direction="row" sx={{ gap: 2 }}>
          <Button
            aria-pressed={showBrokerageTotals}
            onClick={toggleBrokerageTotals}
            variant="outlined"
          >
            {showBrokerageTotals ? "증권사 합계 숨기기" : "증권사 합계 보기"}
          </Button>
          <Button component={Link} href="/record" variant="contained">
            매수 기록 추가
          </Button>
        </Stack>
      </Stack>

      <SummaryStrip dashboard={dashboard} onRefresh={refreshPrices} refreshing={refreshing} />

      {isEmpty ? (
        <Stack
          component="aside"
          direction={{ xs: "column", sm: "row" }}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
            gap: 4,
            p: 5,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
          }}
        >
          <Box>
            <Typography component="h2" variant="h2">
              아직 기록된 보유 종목이 없습니다
            </Typography>
            <Typography sx={{ mt: 1, color: "text.secondary" }}>
              첫 매수 기록을 남기면 이곳에서 가족별 현황을 볼 수 있습니다.
            </Typography>
          </Box>
          <Button component={Link} href="/record" variant="contained">
            첫 매수 기록 추가
          </Button>
        </Stack>
      ) : null}

      {isEmpty ? null : <StockSummarySection stockSummaries={dashboard.stockSummaries} />}

      <Box aria-busy={refreshing} sx={{ display: "grid", gap: { xs: 5, sm: 6 } }}>
        {dashboard.owners.map((owner, index) => (
          <OwnerSection
            key={owner.ownerId}
            owner={owner}
            ownerIndex={index}
            showBrokerageTotals={showBrokerageTotals}
          />
        ))}
      </Box>
    </PageContainer>
  );
}
