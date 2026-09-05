import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import { stockImageUrl } from "@/lib/stock-image";

import { formatInteger, formatSeoulDateTime, formatWon, numericSign } from "./format";
import { sideLabel, type TradeHistoryRow, type TradeSide } from "./types";

interface ProfitProps {
  readonly value: string | null;
}

type ProfitTone = "gain" | "loss" | undefined;

function profitTone(value: string | null): ProfitTone {
  if (value === null) return undefined;
  const sign = numericSign(value);
  if (sign === 1) return "gain";
  return sign === -1 ? "loss" : undefined;
}

function profitColor(value: string | null): "gain.main" | "loss.main" | undefined {
  const tone = profitTone(value);
  return tone ? (`${tone}.main` as const) : undefined;
}

function profitBackground(tone: ProfitTone): "gain.light" | "loss.light" | undefined {
  return tone ? (`${tone}.light` as const) : undefined;
}

function Profit({ value }: ProfitProps) {
  if (value === null) return <Typography color="textSecondary">계산 불가</Typography>;
  const sign = numericSign(value);
  if (sign === null) return <Typography color="textSecondary">계산 불가</Typography>;
  const negative = sign === -1;
  const zero = sign === 0;
  const visible = `${negative || zero ? "" : "+"}${formatWon(value)}`;
  return (
    <Typography
      className="profit-value"
      component="span"
      sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums", color: profitColor(value) }}
    >
      <Box
        component="span"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
        }}
      >
        {negative ? "손실" : zero ? "손익 없음" : "이익"}{" "}
      </Box>
      {visible}
    </Typography>
  );
}

interface SelectionCheckboxProps {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly row: TradeHistoryRow;
  readonly onToggle: (id: string) => void;
}

function SelectionCheckbox({ checked, disabled, row, onToggle }: SelectionCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      disabled={disabled}
      slotProps={{ input: { "aria-label": `${row.stockName} 거래 선택` } }}
      onChange={() => onToggle(row.id)}
    />
  );
}

interface TradeHistoryRowsProps {
  readonly deleting: boolean;
  readonly rows: readonly TradeHistoryRow[];
  readonly selectedIds: ReadonlySet<string>;
  readonly selectionMode: boolean;
  readonly side: TradeSide;
  readonly onEdit: (row: TradeHistoryRow, trigger: HTMLButtonElement) => void;
  readonly onToggle: (id: string) => void;
}

function StockIdentity({
  code,
  name,
  headingId,
}: Readonly<{ code: string; name: string; headingId?: string }>) {
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
        style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0 }}
      />
      <Typography component={headingId ? "h3" : "span"} id={headingId} sx={{ fontWeight: 600 }}>
        {name}
      </Typography>
    </Stack>
  );
}

export function TradeHistoryTable({
  deleting,
  onEdit,
  onToggle,
  rows,
  selectedIds,
  selectionMode,
  side,
}: TradeHistoryRowsProps) {
  const label = sideLabel(side);
  return (
    <TableContainer sx={{ display: { xs: "none", lg: "block" }, mt: 4 }}>
      <Table aria-label={`${label} 거래 내역, 최신 거래순`} size="small">
        <TableHead>
          <TableRow>
            {selectionMode ? <TableCell padding="checkbox">선택</TableCell> : null}
            <TableCell>{label} 일시</TableCell>
            <TableCell>소유주</TableCell>
            <TableCell>증권사</TableCell>
            <TableCell>종목명</TableCell>
            <TableCell align="right">수량</TableCell>
            <TableCell align="right">당시 단가</TableCell>
            <TableCell align="right">{label}액</TableCell>
            {side === "SELL" ? <TableCell align="right">손익</TableCell> : null}
            {!selectionMode ? <TableCell align="right">관리</TableCell> : null}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const tone = side === "SELL" ? profitTone(row.profit) : undefined;
            const zebra =
              side === "SELL" ? undefined : index % 2 === 1 ? "action.hover" : "transparent";
            return (
              <TableRow
                data-profit-tone={tone}
                hover
                key={row.id}
                sx={{ bgcolor: profitBackground(tone) ?? zebra }}
              >
                {selectionMode ? (
                  <TableCell padding="checkbox">
                    <SelectionCheckbox
                      checked={selectedIds.has(row.id)}
                      disabled={deleting}
                      onToggle={onToggle}
                      row={row}
                    />
                  </TableCell>
                ) : null}
                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  <time dateTime={row.executedAt}>{formatSeoulDateTime(row.executedAt)}</time>
                </TableCell>
                <TableCell>{row.ownerName}</TableCell>
                <TableCell>{row.brokerageName}</TableCell>
                <TableCell component="th" scope="row">
                  <StockIdentity code={row.stockCode} name={row.stockName} />
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatInteger(row.quantity)}주
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatWon(row.unitPrice)}
                </TableCell>
                <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatWon(row.amount)}
                </TableCell>
                {side === "SELL" ? (
                  <TableCell align="right">
                    <Profit value={row.profit} />
                  </TableCell>
                ) : null}
                {!selectionMode ? (
                  <TableCell align="right">
                    <Button
                      onClick={(event) => onEdit(row, event.currentTarget)}
                      size="small"
                      variant="outlined"
                    >
                      수정
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function TradeHistoryCards({
  deleting,
  onEdit,
  onToggle,
  rows,
  selectedIds,
  selectionMode,
  side,
}: TradeHistoryRowsProps) {
  const label = sideLabel(side);
  return (
    <Box
      component="ul"
      sx={{
        display: { xs: "grid", lg: "none" },
        gap: 3,
        mx: 0,
        mb: 0,
        mt: 4,
        p: 0,
        listStyle: "none",
      }}
    >
      {rows.map((row) => {
        const tone = side === "SELL" ? profitTone(row.profit) : undefined;
        return (
          <Box component="li" key={row.id}>
            <Box
              aria-labelledby={`trade-card-${row.id}`}
              component="article"
              data-profit-tone={tone}
              sx={{ p: 3, borderRadius: 2, bgcolor: profitBackground(tone) ?? "action.hover" }}
            >
              <Stack
                direction="row"
                sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 2 }}
              >
                <StockIdentity
                  code={row.stockCode}
                  headingId={`trade-card-${row.id}`}
                  name={row.stockName}
                />
                <Stack sx={{ alignItems: "flex-end", gap: 1 }}>
                  {selectionMode ? (
                    <SelectionCheckbox
                      checked={selectedIds.has(row.id)}
                      disabled={deleting}
                      onToggle={onToggle}
                      row={row}
                    />
                  ) : (
                    <Button
                      onClick={(event) => onEdit(row, event.currentTarget)}
                      size="small"
                      variant="outlined"
                    >
                      수정
                    </Button>
                  )}
                  <Typography color="textSecondary" variant="body2">
                    <time dateTime={row.executedAt}>{formatSeoulDateTime(row.executedAt)}</time>
                  </Typography>
                </Stack>
              </Stack>
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
                  <Typography color="textSecondary" component="dt" variant="body2">
                    소유주
                  </Typography>
                  <Typography component="dd" sx={{ m: 0 }}>
                    {row.ownerName}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary" component="dt" variant="body2">
                    증권사
                  </Typography>
                  <Typography component="dd" sx={{ m: 0 }}>
                    {row.brokerageName}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary" component="dt" variant="body2">
                    {label} 수량
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, fontVariantNumeric: "tabular-nums" }}>
                    {formatInteger(row.quantity)}주
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary" component="dt" variant="body2">
                    {label} 당시 단가
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, fontVariantNumeric: "tabular-nums" }}>
                    {formatWon(row.unitPrice)}
                  </Typography>
                </Box>
                <Box>
                  <Typography color="textSecondary" component="dt" variant="body2">
                    {label}액
                  </Typography>
                  <Typography component="dd" sx={{ m: 0, fontVariantNumeric: "tabular-nums" }}>
                    {formatWon(row.amount)}
                  </Typography>
                </Box>
                {side === "SELL" ? (
                  <Box>
                    <Typography color="textSecondary" component="dt" variant="body2">
                      손익
                    </Typography>
                    <Box component="dd" sx={{ m: 0 }}>
                      <Profit value={row.profit} />
                    </Box>
                  </Box>
                ) : null}
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
