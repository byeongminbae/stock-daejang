"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRef, useState } from "react";

import type { Brokerage, Owner } from "@/lib/api-contracts";

import { TradeDeleteConfirmationDialog } from "./TradeDeleteConfirmationDialog";
import { TradeEditDialog } from "./TradeEditDialog";
import { TradeHistoryCards, TradeHistoryTable } from "./TradeHistoryRows";
import { sideLabel, type TradeHistoryRow, type TradeSide } from "./types";
import { useTradeDeletion } from "./useTradeDeletion";

interface TradeHistoryProps {
  readonly brokerages: readonly Brokerage[];
  readonly side: TradeSide;
  readonly rows: readonly TradeHistoryRow[];
  readonly total: number;
  readonly hasFilters?: boolean;
  readonly owners: readonly Owner[];
}

export function TradeHistory({
  brokerages,
  side,
  rows,
  total,
  hasFilters = false,
  owners,
}: TradeHistoryProps) {
  const label = sideLabel(side);
  const deletion = useTradeDeletion({ rows, side });
  const [editingRow, setEditingRow] = useState<TradeHistoryRow | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const editTriggerRef = useRef<HTMLButtonElement>(null);

  const closeEdit = () => {
    setEditingRow(null);
    window.requestAnimationFrame(() => editTriggerRef.current?.focus());
  };
  const openEdit = (row: TradeHistoryRow, trigger: HTMLButtonElement) => {
    editTriggerRef.current = trigger;
    setEditStatus("");
    setEditingRow(row);
  };
  const savedEdit = () => {
    setEditStatus(`${label} 기록을 수정했습니다.`);
    closeEdit();
  };

  if (rows.length === 0) {
    return (
      <Card component="section" sx={{ mt: 4 }} variant="outlined">
        <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
          <Typography component="h2" variant="h2">
            {label} 내역
          </Typography>
          <Typography color="textSecondary" sx={{ mt: 2 }}>
            {hasFilters
              ? "조건과 일치하는 거래가 없습니다. 필터를 조정하거나 초기화해 주세요."
              : `아직 ${label} 기록이 없습니다.`}
          </Typography>
          {deletion.status ? (
            <Alert severity={deletion.status.tone} sx={{ mt: 3 }}>
              {deletion.status.text}
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card component="section" sx={{ mt: 4 }} variant="outlined">
      <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
        <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
          <Box>
            <Typography component="h2" variant="h2">
              {label} 내역
            </Typography>
            <Typography color="textSecondary" sx={{ mt: 0.5 }} variant="body2">
              총 {total.toLocaleString("ko-KR")}건
            </Typography>
          </Box>
          {!deletion.selectionMode ? (
            <Button color="error" onClick={deletion.startSelection} variant="outlined">
              삭제
            </Button>
          ) : null}
        </Stack>
        {deletion.selectionMode ? (
          <Stack
            direction="row"
            sx={{ alignItems: "center", justifyContent: "space-between", mt: 3 }}
          >
            <Typography aria-live="polite" role="status">
              {deletion.selectedRowIds.length.toLocaleString("ko-KR")}건 선택됨
            </Typography>
            <Stack direction="row" sx={{ gap: 2 }}>
              <Button
                color="error"
                disabled={deletion.selectedRowIds.length === 0}
                onClick={deletion.openConfirmation}
                variant="contained"
              >
                {deletion.deleting ? "삭제 중" : "선택 삭제"}
              </Button>
              <Button
                disabled={deletion.deleting}
                onClick={deletion.cancelSelection}
                variant="outlined"
              >
                취소
              </Button>
            </Stack>
          </Stack>
        ) : null}
        {editStatus ? (
          <Alert severity="success" sx={{ mt: 3 }}>
            {editStatus}
          </Alert>
        ) : null}
        {deletion.status ? (
          <Alert severity={deletion.status.tone} sx={{ mt: 3 }}>
            {deletion.status.text}
          </Alert>
        ) : null}
        <TradeHistoryTable
          deleting={deletion.deleting}
          onEdit={openEdit}
          onToggle={deletion.toggleSelection}
          rows={rows}
          selectedIds={deletion.selectedIds}
          selectionMode={deletion.selectionMode}
          side={side}
        />
        <TradeHistoryCards
          deleting={deletion.deleting}
          onEdit={openEdit}
          onToggle={deletion.toggleSelection}
          rows={rows}
          selectedIds={deletion.selectedIds}
          selectionMode={deletion.selectionMode}
          side={side}
        />
        <TradeDeleteConfirmationDialog
          deleting={deletion.deleting}
          onCancel={deletion.cancelConfirmation}
          onConfirm={deletion.confirmDeletion}
          open={deletion.confirming}
          rows={deletion.selectedRows}
          side={side}
        />
        <TradeEditDialog
          brokerages={brokerages}
          onCancel={closeEdit}
          onSaved={savedEdit}
          open={editingRow !== null}
          owners={owners}
          row={editingRow}
          side={side}
        />
      </CardContent>
    </Card>
  );
}
