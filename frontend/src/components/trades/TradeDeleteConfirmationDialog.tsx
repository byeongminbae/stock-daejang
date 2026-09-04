"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useId, useState } from "react";

import { formatSeoulDateTime } from "./format";
import { sideLabel, type TradeHistoryRow, type TradeSide } from "./types";

interface TradeDeleteConfirmationDialogProps {
  readonly deleting: boolean;
  readonly open: boolean;
  readonly rows: readonly TradeHistoryRow[];
  readonly side: TradeSide;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function TradeDeleteConfirmationDialog({
  deleting,
  open,
  rows,
  side,
  onCancel,
  onConfirm,
}: TradeDeleteConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
  const label = sideLabel(side);
  const isConfirmed = confirmationText === "삭제";
  const confirmationInputId = useId();

  const cancelDeletion = () => {
    setConfirmationText("");
    onCancel();
  };

  const confirmDeletion = () => {
    if (!isConfirmed) return;
    setConfirmationText("");
    onConfirm();
  };

  return (
    <Dialog
      onClose={(_event, reason) => {
        if (reason === "backdropClick" && deleting) return;
        cancelDeletion();
      }}
      open={open}
    >
      <DialogTitle>{label} 기록 삭제</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3 }}>
          선택한 {rows.length.toLocaleString("ko-KR")}건의 {label} 기록을 삭제할까요? 삭제하면
          되돌릴 수 없습니다.
        </DialogContentText>
        <Box
          aria-label={`삭제할 ${label} 기록`}
          component="ul"
          sx={{ mt: 0, mx: 0, mb: 3, p: 0, listStyle: "none", display: "grid", gap: 2 }}
        >
          {rows.map((row) => (
            <Box
              component="li"
              key={row.id}
              sx={{ p: 2, borderRadius: 1, bgcolor: "action.hover" }}
            >
              <Typography variant="body2">
                <time dateTime={row.executedAt}>{formatSeoulDateTime(row.executedAt)}</time>
                {" · "}
                {row.stockName} · {row.brokerageName}
              </Typography>
            </Box>
          ))}
        </Box>
        <TextField
          autoComplete="off"
          autoFocus
          fullWidth
          helperText={
            <>
              계속하려면 <strong>삭제</strong>를 정확히 입력해 주세요.
            </>
          }
          id={confirmationInputId}
          label="삭제 확인"
          onChange={(event) => setConfirmationText(event.currentTarget.value)}
          spellCheck={false}
          value={confirmationText}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={cancelDeletion} variant="outlined">
          취소
        </Button>
        <Button
          color="error"
          disabled={!isConfirmed || deleting}
          onClick={confirmDeletion}
          variant="contained"
        >
          {deleting ? "삭제 중" : "삭제"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
