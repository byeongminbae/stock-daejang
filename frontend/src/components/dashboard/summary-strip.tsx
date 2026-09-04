import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import type { MarketSession } from "@/lib/api-contracts";

import { formatDashboardWon, formatQuoteTime, formatSignedWon } from "./format";
import type { DashboardResponse } from "./types";

type SummaryStripProps = Readonly<{
  dashboard: DashboardResponse;
  refreshing: boolean;
  onRefresh: () => void;
}>;

const marketSessionLabels = {
  PREOPEN: "정규장",
  PRE_MARKET: "프리",
  REGULAR_MARKET: "정규장",
  AFTER_MARKET: "에프터",
} as const satisfies Readonly<Record<MarketSession, string>>;

function StatTile({
  label,
  value,
  tone,
}: Readonly<{ label: string; value: string; tone?: "gain" | "loss" | undefined }>) {
  return (
    <Box
      sx={{
        p: 4,
        borderRadius: 2,
        bgcolor: tone === "gain" ? "gain.light" : tone === "loss" ? "loss.light" : "action.hover",
      }}
    >
      <Typography component="dt" sx={{ color: "text.secondary" }} variant="body2">
        {label}
      </Typography>
      <Typography
        component="dd"
        sx={{
          mt: 1,
          ml: 0,
          fontWeight: 700,
          fontVariantNumeric: "tabular-nums",
          color: tone === "gain" ? "gain.main" : tone === "loss" ? "loss.main" : "text.primary",
        }}
        variant="h3"
      >
        {value}
      </Typography>
    </Box>
  );
}

export function SummaryStrip({ dashboard, refreshing, onRefresh }: SummaryStripProps) {
  const { stockCount, totalBuyAmount, unrealizedProfit, valuation } = dashboard;
  const quoteMetadata =
    dashboard.valuationSession === null
      ? { quoteTime: formatQuoteTime(dashboard.quoteFetchedAt), valuationBasis: "-" }
      : {
          quoteTime: formatQuoteTime(dashboard.quoteFetchedAt),
          valuationBasis: marketSessionLabels[dashboard.valuationSession],
        };
  const profitTone = unrealizedProfit === 0 ? undefined : unrealizedProfit > 0 ? "gain" : "loss";

  return (
    <Card component="section" aria-labelledby="portfolio-summary" variant="outlined">
      <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            justifyContent: "space-between",
            gap: 3,
            mb: 4,
          }}
        >
          <Box>
            <Typography component="h1" id="portfolio-summary" variant="h2">
              전체 보유 현황
            </Typography>
            <Typography sx={{ mt: 0.5, color: "text.secondary" }} variant="body2">
              {quoteMetadata.quoteTime}
            </Typography>
          </Box>
          <Button
            aria-busy={refreshing}
            disabled={refreshing}
            onClick={onRefresh}
            variant="contained"
          >
            {refreshing ? "가격 확인 중" : "가격 새로고침"}
          </Button>
        </Stack>

        <Box
          aria-live="polite"
          component="dl"
          sx={{
            m: 0,
            display: "grid",
            gap: 3,
            gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", lg: "repeat(5, 1fr)" },
          }}
        >
          <StatTile label="보유 종목" value={`${stockCount}개`} />
          <StatTile label="평가 기준" value={quoteMetadata.valuationBasis} />
          <StatTile label="전체 매입액" value={formatDashboardWon(totalBuyAmount)} />
          <StatTile label="전체 평가액" value={formatDashboardWon(valuation)} />
          <Box sx={{ gridColumn: { xs: "1 / -1", sm: "auto" } }}>
            <StatTile
              label="평가 손익"
              tone={profitTone}
              value={formatSignedWon(unrealizedProfit)}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
