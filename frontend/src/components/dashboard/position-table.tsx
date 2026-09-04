import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableFooter from "@mui/material/TableFooter";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
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
import type { DashboardBrokerage, DashboardOwner, SortDirection, SortField } from "./types";

const columns: readonly Readonly<{ field: SortField; label: string }>[] = [
  { field: "stockName", label: "종목" },
  { field: "quantity", label: "보유 수량" },
  { field: "averageBuyPrice", label: "매수평균단가" },
  { field: "totalBuyAmount", label: "매입액" },
  { field: "brokerageWeight", label: "증권사 비중" },
  { field: "currentPrice", label: "현재가" },
  { field: "unrealizedProfit", label: "평가 손익" },
  { field: "valuation", label: "평가액" },
  { field: "returnRate", label: "수익률" },
];

type PositionTableProps = Readonly<{
  owner: DashboardOwner;
  brokerages: readonly DashboardBrokerage[];
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
  showBrokerageTotals: boolean;
}>;

function profitColor(state: string): "gain.main" | "loss.main" | undefined {
  if (state === "이익") return "gain.main";
  if (state === "손실") return "loss.main";
  return undefined;
}

function PositionTotalCells({
  aggregate,
}: Readonly<{ aggregate: DashboardBrokerage | DashboardOwner }>) {
  const profitState = profitLabel(aggregate.unrealizedProfit);
  const color = profitColor(profitState);
  const numericCell = { align: "right" as const, sx: { fontVariantNumeric: "tabular-nums" } };

  return (
    <>
      <TableCell {...numericCell}>
        <span style={visuallyHidden}>보유 수량은 합산하지 않습니다</span>
      </TableCell>
      <TableCell {...numericCell}>
        <span style={visuallyHidden}>매수평균단가는 합산하지 않습니다</span>
      </TableCell>
      <TableCell {...numericCell}>{formatDashboardWon(aggregate.totalBuyAmount)}</TableCell>
      <TableCell {...numericCell}>
        <span style={visuallyHidden}>증권사 비중은 종목별로만 표시합니다</span>
      </TableCell>
      <TableCell {...numericCell}>
        <span style={visuallyHidden}>현재가는 합산하지 않습니다</span>
      </TableCell>
      <TableCell {...numericCell} sx={{ ...numericCell.sx, color, fontWeight: 700 }}>
        <span style={visuallyHidden}>{profitState} </span>
        {formatSignedWon(aggregate.unrealizedProfit)}
      </TableCell>
      <TableCell {...numericCell}>{formatDashboardWon(aggregate.valuation)}</TableCell>
      <TableCell {...numericCell}>
        <span style={visuallyHidden}>수익률은 합산하지 않습니다</span>
      </TableCell>
    </>
  );
}

export function PositionTable({
  owner,
  brokerages,
  sortField,
  sortDirection,
  onSort,
  showBrokerageTotals,
}: PositionTableProps) {
  return (
    <TableContainer sx={{ display: { xs: "none", lg: "block" } }}>
      <Table aria-label={`${owner.ownerName}의 보유 종목 현황`} size="small">
        <caption style={{ ...visuallyHidden, captionSide: "top" }}>
          {owner.ownerName}의 보유 종목 현황
        </caption>
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: "11%" }}>증권사</TableCell>
            {columns.map((column) => (
              <TableCell
                align={column.field === "stockName" ? "left" : "right"}
                key={column.field}
                sortDirection={sortField === column.field ? sortDirection : false}
              >
                <TableSortLabel
                  active={sortField === column.field}
                  direction={sortField === column.field ? sortDirection : "desc"}
                  onClick={() => onSort(column.field)}
                >
                  {column.label}
                </TableSortLabel>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        {brokerages.map((brokerage) => (
          <TableBody key={brokerage.brokerageCode}>
            {brokerage.stocks.map((stock, stockIndex) => {
              const profitState = profitLabel(stock.unrealizedProfit);
              const color = profitColor(profitState);
              return (
                <TableRow hover key={`${brokerage.brokerageCode}-${stock.stockCode}`}>
                  {stockIndex === 0 ? (
                    <TableCell
                      component="th"
                      rowSpan={brokerage.stocks.length}
                      scope="rowgroup"
                      sx={{ bgcolor: "action.hover", verticalAlign: "top" }}
                    >
                      <Typography sx={{ fontWeight: 600 }} variant="body2">
                        {brokerage.brokerageName}
                      </Typography>
                    </TableCell>
                  ) : null}
                  <TableCell component="th" scope="row">
                    <Stack direction="row" sx={{ alignItems: "center", gap: 2.5 }}>
                      {/* biome-ignore lint/performance/noImgElement: external hotlinked SVG, avoids next/image's dangerouslyAllowSVG */}
                      <img
                        alt=""
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        src={stockImageUrl(stock.stockCode)}
                        style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontWeight: 600 }} variant="body2">
                          {stock.stockName}
                        </Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          {stock.stockCode}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatDashboardQuantity(stock.quantity)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatDashboardWon(stock.averageBuyPrice)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatDashboardWon(stock.totalBuyAmount)}
                  </TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {formatDashboardPercent(stock.brokerageWeight)}
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
            {showBrokerageTotals ? (
              <TableRow sx={{ bgcolor: "action.hover" }}>
                <TableCell colSpan={2} component="th" scope="row" sx={{ fontWeight: 700 }}>
                  {brokerage.brokerageName} 합계 ({brokerage.stockCount}종목)
                </TableCell>
                <PositionTotalCells aggregate={brokerage} />
              </TableRow>
            ) : null}
          </TableBody>
        ))}
        <TableFooter>
          <TableRow sx={{ bgcolor: "grey.100" }}>
            <TableCell colSpan={2} component="th" scope="row" sx={{ fontWeight: 700 }}>
              전체 합계 ({owner.stockCount}종목)
            </TableCell>
            <PositionTotalCells aggregate={owner} />
          </TableRow>
        </TableFooter>
      </Table>
    </TableContainer>
  );
}
