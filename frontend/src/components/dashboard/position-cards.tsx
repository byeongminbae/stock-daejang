import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { stockImageUrl } from "@/lib/stock-image";
import { visuallyHidden } from "@/lib/visually-hidden";

import {
  formatDashboardPercent,
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
  showBrokerageTotals: boolean;
}>;

function profitColor(state: string): "gain.main" | "loss.main" | undefined {
  if (state === "이익") return "gain.main";
  if (state === "손실") return "loss.main";
  return undefined;
}

function MetricField({
  label,
  value,
  omitted,
  srPrefix,
  color,
  span,
}: Readonly<{
  label: string;
  value?: string;
  omitted?: string;
  srPrefix?: string;
  color?: "gain.main" | "loss.main" | undefined;
  span?: boolean;
}>) {
  return (
    <Box sx={{ minWidth: 0, gridColumn: span ? "1 / -1" : undefined }}>
      <Typography component="dt" variant="body2" sx={{ color: "text.secondary" }}>
        {label}
      </Typography>
      <Typography
        component="dd"
        sx={{ m: 0, fontWeight: color ? 700 : 500, fontVariantNumeric: "tabular-nums", color }}
      >
        {omitted ? (
          <span style={visuallyHidden}>{omitted}</span>
        ) : (
          <>
            {srPrefix ? <span style={visuallyHidden}>{srPrefix} </span> : null}
            {value}
          </>
        )}
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
      <MetricField label="보유 수량" omitted="보유 수량은 합산하지 않습니다" />
      <MetricField label="매수평균단가" omitted="매수평균단가는 합산하지 않습니다" />
      <MetricField label="매입액" value={formatDashboardWon(aggregate.totalBuyAmount)} />
      <MetricField label="현재가" omitted="현재가는 합산하지 않습니다" />
      <MetricField
        color={color}
        label="평가 손익"
        srPrefix={profitState}
        value={formatSignedWon(aggregate.unrealizedProfit)}
      />
      <MetricField label="평가액" value={formatDashboardWon(aggregate.valuation)} />
      <MetricField label="수익률" omitted="수익률은 합산하지 않습니다" />
    </Box>
  );
}

export function PositionCards({ owner, brokerages, showBrokerageTotals }: PositionCardsProps) {
  return (
    <>
      <Box sx={{ display: { xs: "block", lg: "none" } }}>
        {brokerages.map((brokerage) => (
          <Box key={brokerage.brokerageCode} sx={{ mt: 4, "&:first-of-type": { mt: 0 } }}>
            <Box
              aria-label={`${owner.ownerName}의 ${brokerage.brokerageName} 보유 종목 현황`}
              component="ul"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 3,
                m: 0,
                p: 0,
                listStyle: "none",
              }}
            >
              {brokerage.stocks.map((stock) => {
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
                          <Typography
                            component="h4"
                            noWrap
                            sx={{ fontWeight: 700 }}
                            variant="body1"
                          >
                            {stock.stockName}
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
                        <MetricField label="소유주" value={owner.ownerName} />
                        <MetricField label="증권사" value={brokerage.brokerageName} />
                        <MetricField
                          label="보유 수량"
                          value={formatDashboardQuantity(stock.quantity)}
                        />
                        <MetricField
                          label="매수평균단가"
                          value={formatDashboardWon(stock.averageBuyPrice)}
                        />
                        <MetricField
                          label="매입액"
                          value={formatDashboardWon(stock.totalBuyAmount)}
                        />
                        <MetricField
                          label="증권사 비중"
                          value={formatDashboardPercent(stock.brokerageWeight)}
                        />
                        <MetricField
                          label="현재가"
                          value={formatDashboardWon(stock.currentPrice)}
                        />
                        <MetricField
                          color={color}
                          label="평가 손익"
                          srPrefix={profitState}
                          value={formatSignedWon(stock.unrealizedProfit)}
                        />
                        <MetricField label="평가액" value={formatDashboardWon(stock.valuation)} />
                        <MetricField
                          color={color}
                          label="수익률"
                          span
                          srPrefix={profitState}
                          value={formatSignedPercent(stock.returnRate)}
                        />
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            {showBrokerageTotals ? (
              <Box
                aria-label={`${brokerage.brokerageName} 합계`}
                component="aside"
                sx={{ mt: 3, p: 3, borderRadius: 2, border: "1px dashed", borderColor: "divider" }}
              >
                <Typography component="h3" sx={{ fontWeight: 700 }} variant="body1">
                  {brokerage.brokerageName} 합계 ({brokerage.stockCount}종목)
                </Typography>
                <PositionTotalMetrics aggregate={brokerage} />
              </Box>
            ) : null}
          </Box>
        ))}
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
