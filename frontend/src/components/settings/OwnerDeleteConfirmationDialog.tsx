"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/status-message";
import type { Owner } from "@/lib/api-contracts";

import styles from "./owner-settings.module.css";

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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const isConfirmed = confirmationText === "삭제";
  const open = owner !== null;
  const titleId = useId();
  const descriptionId = useId();
  const confirmationInputId = useId();
  const confirmationHintId = useId();

  const cancelDeletion = () => {
    setConfirmationText("");
    onCancel();
  };

  const confirmDeletion = () => {
    if (!isConfirmed) return;
    setConfirmationText("");
    onConfirm();
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className={styles.confirmationDialog}
      onCancel={(event) => {
        event.preventDefault();
        cancelDeletion();
      }}
      ref={dialogRef}
    >
      {owner ? (
        <div className={styles.confirmationContent}>
          <h3 id={titleId}>소유주 삭제</h3>
          <p id={descriptionId}>
            <strong>{owner.name}</strong> 소유주를 삭제할까요? 삭제하면 되돌릴 수 없습니다.
          </p>
          <div className="field">
            <label className="field-label" htmlFor={confirmationInputId}>
              삭제 확인
            </label>
            <input
              aria-describedby={confirmationHintId}
              autoComplete="off"
              autoFocus
              className="control"
              id={confirmationInputId}
              onChange={(event) => setConfirmationText(event.currentTarget.value)}
              spellCheck={false}
              type="text"
              value={confirmationText}
            />
            <p className="field-hint" id={confirmationHintId}>
              계속하려면 <strong>삭제</strong>를 정확히 입력해 주세요.
            </p>
          </div>
          {error ? <StatusMessage tone="error">{error}</StatusMessage> : null}
          <div className={styles.confirmationActions}>
            <Button onClick={cancelDeletion} variant="secondary">
              취소
            </Button>
            <Button
              disabled={!isConfirmed}
              isBusy={deleting}
              onClick={confirmDeletion}
              variant="danger"
            >
              삭제
            </Button>
          </div>
        </div>
      ) : null}
    </dialog>
  );
}
