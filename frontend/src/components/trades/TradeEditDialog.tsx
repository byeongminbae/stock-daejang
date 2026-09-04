"use client";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

import type { Brokerage, Owner } from "@/lib/api-contracts";

import { isoInstantToSeoulDateTimeLocal } from "./format";
import { TradeEntryFields } from "./TradeEntryFields";
import { sideLabel, type TradeHistoryRow, type TradeSide } from "./types";
import { useTradeEntryForm } from "./useTradeEntryForm";

interface TradeEditDialogProps {
  readonly brokerages: readonly Brokerage[];
  readonly open: boolean;
  readonly owners: readonly Owner[];
  readonly row: TradeHistoryRow | null;
  readonly side: TradeSide;
  readonly onCancel: () => void;
  readonly onSaved: () => void;
}

interface TradeEditFormProps {
  readonly brokerages: readonly Brokerage[];
  readonly onCancel: () => void;
  readonly owners: readonly Owner[];
  readonly row: TradeHistoryRow;
  readonly side: TradeSide;
  readonly onSaved: () => void;
}

function TradeEditForm({ brokerages, onCancel, onSaved, owners, row, side }: TradeEditFormProps) {
  const label = sideLabel(side);
  const form = useTradeEntryForm({
    side,
    tradeId: row.id,
    initialValues: {
      brokerageCode: row.brokerageCode,
      executedAt: isoInstantToSeoulDateTimeLocal(row.executedAt),
      ownerId: row.ownerId.toString(),
      stock: {
        code: row.stockCode,
        isEtf: row.isEtf,
        market: row.market,
        name: row.stockName,
      },
      quantity: row.quantity,
      unitPrice: row.unitPrice,
    },
    onSaved: () => onSaved(),
  });

  return (
    <TradeEntryFields
      brokerages={brokerages}
      compact
      form={form}
      formId={`${side}-edit-${row.id}`}
      onCancel={onCancel}
      owners={owners}
      side={side}
      submitLabel={`${label} 기록 수정`}
    />
  );
}

export function TradeEditDialog({
  brokerages,
  onCancel,
  onSaved,
  open,
  owners,
  row,
  side,
}: TradeEditDialogProps) {
  const label = sideLabel(side);

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onCancel}
      open={open}
      slotProps={{ paper: { sx: { p: 1 } } }}
    >
      <DialogTitle>{label} 기록 수정</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          기록의 거래일시, 종목, 소유주, 증권사, 수량, 단가를 수정할 수 있습니다.
        </DialogContentText>
        {row ? (
          <TradeEditForm
            brokerages={brokerages}
            key={row.id}
            onCancel={onCancel}
            onSaved={onSaved}
            owners={owners}
            row={row}
            side={side}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
