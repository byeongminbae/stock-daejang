import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { stockImageUrl } from "@/lib/stock-image";
import { visuallyHidden } from "@/lib/visually-hidden";

import {
  formatDashboardQuantity,
  formatDashboardWon,
  formatSignedPercent,
  formatSignedWon,
  profitLabel,
} from "./format";
import type { DashboardBrokerage, DashboardOwner } from "./types";

type PositionCardsProps = Readonly<{
  owner: DashboardOwner;
  brokerages: readonly DashboardBrokerage[];
}>;

function profitColor(state: string): "gain.main" | "loss.main" | undefined {
  if (state === "이익") return "gain.main";
  if (state === "손실") return "loss.main";
  return undefined;
}

function MetricField({
  label,
  value,
  srPrefix,
  color,
}: Readonly<{
  label: string;
  value: string;
  srPrefix?: string;
  color?: "gain.main" | "loss.main" | undefined;
}>) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography component="dt" variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        component="dd"
        sx={{ m: 0, fontWeight: color ? 700 : 500, fontVariantNumeric: "tabular-nums", color }}
      >
        {srPrefix ? <span style={visuallyHidden}>{srPrefix} </span> : null}
        {value}
      </Typography>
    </Box>
  );
}

function PositionTotalMetrics({
  aggregate,
}: Readonly<{ aggregate: DashboardBrokerage | DashboardOwner }>) {
  const profitState = profitLabel(aggregate.unrealizedProfit);
  const color = profitColor(profitState);

  return (
    <Box
      component="dl"
      sx={{ mx: 0, mb: 0, mt: 3, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}
    >
      <MetricField label="평가액" value={formatDashboardWon(aggregate.valuation)} />
      <MetricField
        color={color}
        label="평가 손익"
        srPrefix={profitState}
        value={formatSignedWon(aggregate.unrealizedProfit)}
      />
    </Box>
  );
}

export function PositionCards({ owner, brokerages }: PositionCardsProps) {
  const stockCards = brokerages.flatMap((brokerage) =>
    brokerage.stocks.map((stock) => ({ brokerage, stock })),
  );

  return (
    <>
      <Box
        aria-label={`${owner.ownerName}의 보유 종목 현황`}
        component="ul"
        sx={{
          display: { xs: "grid", lg: "none" },
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 3,
          m: 0,
          p: 0,
          listStyle: "none",
        }}
      >
        {stockCards.map(({ brokerage, stock }) => {
          const profitState = profitLabel(stock.unrealizedProfit);
          const color = profitColor(profitState);
          return (
            <Box
              component="li"
              key={`${brokerage.brokerageCode}-${stock.stockCode}`}
              sx={{ minWidth: 0 }}
            >
              <Box
                component="article"
                sx={{ height: "100%", p: 3, borderRadius: 2, bgcolor: "action.hover" }}
              >
                <Stack direction="row" sx={{ alignItems: "center", gap: 2.5 }}>
                  {/* biome-ignore lint/performance/noImgElement: external hotlinked SVG, avoids next/image's dangerouslyAllowSVG */}
                  <img
                    alt=""
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                    src={stockImageUrl(stock.stockCode)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      flexShrink: 0,
                      background: "#fff",
                    }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography component="h4" noWrap sx={{ fontWeight: 700 }} variant="body1">
                      {stock.stockName}
                      <Box component="span" sx={{ fontWeight: 500, color: "text.secondary" }}>
                        {` (${brokerage.brokerageName})`}
                      </Box>
                    </Typography>
                    <Typography variant="body2" sx={{ color: "text.secondary" }}>
                      {stock.stockCode}
                    </Typography>
                  </Box>
                </Stack>
                <Box
                  component="dl"
                  sx={{
                    m: 0,
                    mt: 3,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  <MetricField label="보유 수량" value={formatDashboardQuantity(stock.quantity)} />
                  <MetricField label="평균단가" value={formatDashboardWon(stock.averageBuyPrice)} />
                  <MetricField label="현재가" value={formatDashboardWon(stock.currentPrice)} />
                  <MetricField label="평가액" value={formatDashboardWon(stock.valuation)} />
                  <Box sx={{ gridColumn: "1 / -1" }}>
                    <Typography component="dt" sx={{ color: "text.secondary" }} variant="body2">
                      평가 손익 · 수익률
                    </Typography>
                    <Typography
                      component="dd"
                      sx={{ m: 0, color, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
                    >
                      <span style={visuallyHidden}>{profitState} </span>
                      {formatSignedWon(stock.unrealizedProfit)} (
                      {formatSignedPercent(stock.returnRate)})
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          );
        })}
      </Box>
      <Box
        aria-label={`${owner.ownerName} 합계`}
        component="aside"
        sx={{
          display: { xs: "block", lg: "none" },
          mt: 4,
          pt: 4,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography component="h3" sx={{ fontWeight: 700 }} variant="body1">
          전체 합계 ({owner.stockCount}종목)
        </Typography>
        <PositionTotalMetrics aggregate={owner} />
      </Box>
    </>
  );
}
