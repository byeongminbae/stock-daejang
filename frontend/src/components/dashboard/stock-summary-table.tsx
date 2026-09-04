import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
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
import type { DashboardStockSummary } from "./types";

type StockSummaryListProps = Readonly<{
  stockSummaries: readonly DashboardStockSummary[];
  ariaLabel: string;
}>;

function profitColor(state: string): "gain.main" | "loss.main" | undefined {
  if (state === "이익") return "gain.main";
  if (state === "손실") return "loss.main";
  return undefined;
}

function StockIdentity({
  code,
  name,
  size = 32,
}: Readonly<{ code: string; name: string; size?: number }>) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 2.5 }}>
      {/* biome-ignore lint/performance/noImgElement: external hotlinked SVG, avoids next/image's dangerouslyAllowSVG */}
      <img
        alt=""
        loading="lazy"
        onError={(event) => {
          event.currentTarget.style.display = "none";
        }}
        src={stockImageUrl(code)}
        style={{ width: size, height: size, borderRadius: 6, flexShrink: 0, background: "#F6F7F9" }}
      />
      <Box sx={{ minWidth: 0 }}>
        <Typography noWrap sx={{ fontWeight: 600 }} variant="body1">
          {name}
        </Typography>
        <Typography sx={{ color: "text.secondary" }} variant="body2">
          {code}
        </Typography>
      </Box>
    </Stack>
  );
}

export function StockSummaryTable({ stockSummaries, ariaLabel }: StockSummaryListProps) {
  return (
    <TableContainer sx={{ display: { xs: "none", lg: "block" } }}>
      <Table aria-label={ariaLabel} size="small">
        <TableHead>
          <TableRow>
            <TableCell>종목</TableCell>
            <TableCell align="right">보유 수량</TableCell>
            <TableCell align="right">매입액</TableCell>
            <TableCell align="right">현재가</TableCell>
            <TableCell align="right">평가 손익</TableCell>
            <TableCell align="right">평가액</TableCell>
            <TableCell align="right">수익률</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stockSummaries.map((stock) => {
            const profitState = profitLabel(stock.unrealizedProfit);
            const color = profitColor(profitState);
            return (
              <TableRow hover key={stock.stockCode}>
                <TableCell component="th" scope="row">
                  <StockIdentity code={stock.stockCode} name={stock.stockName} />
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatDashboardQuantity(stock.quantity)}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatDashboardWon(stock.totalBuyAmount)}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatDashboardWon(stock.currentPrice)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                >
                  <span style={visuallyHidden}>{profitState} </span>
                  {formatSignedWon(stock.unrealizedProfit)}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatDashboardWon(stock.valuation)}
                </TableCell>
                <TableCell
                  align="right"
                  sx={{ color, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
                >
                  <span style={visuallyHidden}>{profitState} </span>
                  {formatSignedPercent(stock.returnRate)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function StockSummaryCards({ stockSummaries, ariaLabel }: StockSummaryListProps) {
  return (
    <Box
      aria-label={ariaLabel}
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
      {stockSummaries.map((stock) => {
        const profitState = profitLabel(stock.unrealizedProfit);
        const color = profitColor(profitState);
        return (
          <Box component="li" key={stock.stockCode} sx={{ minWidth: 0 }}>
            <Box component="article" sx={{ p: 3, borderRadius: 2, bgcolor: "action.hover" }}>
              <StockIdentity code={stock.stockCode} name={stock.stockName} />
              <Box
                component="dl"
                sx={{
                  mx: 0,
                  mb: 0,
                  mt: 3,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 2,
                }}
              >
                <Box>
                  <Typography component="dt" sx={{ color: "text.secondary" }} variant="body2">
                    보유 수량
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, fontVariantNumeric: "tabular-nums" }}>
                    {formatDashboardQuantity(stock.quantity)}
                  </Typography>
                </Box>
                <Box>
                  <Typography component="dt" sx={{ color: "text.secondary" }} variant="body2">
                    매입액
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, fontVariantNumeric: "tabular-nums" }}>
                    {formatDashboardWon(stock.totalBuyAmount)}
                  </Typography>
                </Box>
                <Box>
                  <Typography component="dt" sx={{ color: "text.secondary" }} variant="body2">
                    현재가
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, fontVariantNumeric: "tabular-nums" }}>
                    {formatDashboardWon(stock.currentPrice)}
                  </Typography>
                </Box>
                <Box>
                  <Typography component="dt" sx={{ color: "text.secondary" }} variant="body2">
                    평가액
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, fontVariantNumeric: "tabular-nums" }}>
                    {formatDashboardWon(stock.valuation)}
                  </Typography>
                </Box>
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
  );
}
