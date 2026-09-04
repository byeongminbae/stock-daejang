"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { useId, useState } from "react";

import type { Owner } from "@/lib/api-contracts";

interface OwnerDeleteConfirmationDialogProps {
  readonly deleting: boolean;
  readonly error: string;
  readonly owner: Owner | null;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function OwnerDeleteConfirmationDialog({
  deleting,
  error,
  owner,
  onCancel,
  onConfirm,
}: OwnerDeleteConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState("");
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
      open={owner !== null}
    >
      <DialogTitle>소유주 삭제</DialogTitle>
      <DialogContent>
        {owner ? (
          <DialogContentText sx={{ mb: 4 }}>
            <strong>{owner.name}</strong> 소유주를 삭제할까요? 삭제하면 되돌릴 수 없습니다.
          </DialogContentText>
        ) : null}
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
        {error ? (
          <Alert severity="error" sx={{ mt: 3 }}>
            {error}
          </Alert>
        ) : null}
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
