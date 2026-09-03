"use client";

import ky from "ky";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useId, useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/status-message";
import type { Owner } from "@/lib/api-contracts";

import { OwnerDeleteConfirmationDialog } from "./OwnerDeleteConfirmationDialog";
import styles from "./owner-settings.module.css";

const errorResponseSchema = z.object({
  success: z.literal(false),
  timestamp: z.string(),
  statusCode: z.string(),
  message: z.string(),
});

const createOwnerResponseSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true), timestamp: z.string(), data: z.number().int().positive() }),
  errorResponseSchema,
]);

const deleteOwnerResponseSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true), timestamp: z.string() }),
  errorResponseSchema,
]);

function friendlyOwnerErrorMessage(statusCode: string): string {
  switch (statusCode) {
    case "REQ_001":
      return "이름을 입력해 주세요.";
    case "RES_001":
      return "이미 삭제된 소유주예요. 새로고침 후 다시 시도해 주세요.";
    case "RES_002":
      return "이미 등록된 소유주 이름이에요. 다른 이름을 입력해 주세요.";
    case "RES_003":
      return "거래 내역이 있는 소유주는 삭제할 수 없어요.";
    default:
      return "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}

interface OwnerSettingsProps {
  readonly owners: readonly Owner[];
}

export function OwnerSettings({ owners: initialOwners }: OwnerSettingsProps) {
  const router = useRouter();
  const nameInputId = useId();
  const [owners, setOwners] = useState<readonly Owner[]>(initialOwners);
  const [name, setName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Owner | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const handleAddSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length === 0 || adding) return;

    setAdding(true);
    setAddError("");
    try {
      const response = await ky.post("/api/v1/owners", {
        throwHttpErrors: false,
        timeout: 10_000,
        json: { name: trimmedName },
      });
      const result = createOwnerResponseSchema.parse(await response.json<unknown>());
      if (!response.ok || !result.success) {
        setAddError(
          result.success ? "추가하지 못했습니다." : friendlyOwnerErrorMessage(result.statusCode),
        );
        return;
      }
      setOwners([...owners, { id: result.data, name: trimmedName }]);
      setName("");
      router.refresh();
    } catch {
      setAddError("추가하지 못했습니다.");
    } finally {
      setAdding(false);
    }
  };

  const confirmDelete = async () => {
    if (pendingDelete === null || deleting) return;
    const owner = pendingDelete;

    setDeleting(true);
    setDeleteError("");
    try {
      const response = await ky.delete(`/api/v1/owners/${owner.id}`, {
        throwHttpErrors: false,
        timeout: 10_000,
      });
      const result = deleteOwnerResponseSchema.parse(await response.json<unknown>());
      if (!response.ok || !result.success) {
        setDeleteError(
          result.success ? "삭제하지 못했습니다." : friendlyOwnerErrorMessage(result.statusCode),
        );
        return;
      }
      setOwners(owners.filter((item) => item.id !== owner.id));
      setPendingDelete(null);
      router.refresh();
    } catch {
      setDeleteError("삭제하지 못했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section aria-labelledby="owner-settings-heading" className="panel">
      <h2 id="owner-settings-heading">소유주 관리</h2>
      <form className={styles.addForm} onSubmit={(event) => void handleAddSubmit(event)}>
        <div className={`field ${styles.nameField}`}>
          <label className="field-label" htmlFor={nameInputId}>
            새 소유주 이름
          </label>
          <input
            className="control"
            disabled={adding}
            id={nameInputId}
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="예: 병민"
            value={name}
          />
        </div>
        <Button disabled={name.trim().length === 0} isBusy={adding} type="submit">
          추가
        </Button>
      </form>
      {addError ? <StatusMessage tone="error">{addError}</StatusMessage> : null}

      {owners.length > 0 ? (
        <ul className={styles.ownerList}>
          {owners.map((owner) => (
            <li className={styles.ownerItem} key={owner.id}>
              <span className={styles.ownerName}>{owner.name}</span>
              <Button
                onClick={() => {
                  setDeleteError("");
                  setPendingDelete(owner);
                }}
                variant="danger"
              >
                삭제
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>등록된 소유주가 없습니다.</p>
      )}

      <OwnerDeleteConfirmationDialog
        deleting={deleting}
        error={deleteError}
        onCancel={() => {
          if (deleting) return;
          setPendingDelete(null);
          setDeleteError("");
        }}
        onConfirm={() => void confirmDelete()}
        owner={pendingDelete}
      />
    </section>
  );
}
