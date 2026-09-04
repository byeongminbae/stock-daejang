"use client";

import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ky from "ky";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useId, useState } from "react";
import { z } from "zod";

import type { Owner } from "@/lib/api-contracts";

import { OwnerDeleteConfirmationDialog } from "./OwnerDeleteConfirmationDialog";

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
    <Card component="section" aria-labelledby="owner-settings-heading" variant="outlined">
      <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
        <Typography component="h2" id="owner-settings-heading" sx={{ mb: 4 }} variant="h2">
          소유주 관리
        </Typography>
        <Stack
          component="form"
          direction={{ xs: "column", sm: "row" }}
          onSubmit={(event) => void handleAddSubmit(event)}
          sx={{ alignItems: "stretch", gap: 3 }}
        >
          <TextField
            disabled={adding}
            fullWidth
            id={nameInputId}
            label="새 소유주 이름"
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="예: 병민"
            value={name}
          />
          <Button
            disabled={name.trim().length === 0 || adding}
            sx={{ flexShrink: 0 }}
            type="submit"
            variant="contained"
          >
            {adding ? "추가 중" : "추가"}
          </Button>
        </Stack>
        {addError ? (
          <Alert severity="error" sx={{ mt: 3 }}>
            {addError}
          </Alert>
        ) : null}

        {owners.length > 0 ? (
          <Stack component="ul" sx={{ mt: 4, mx: 0, mb: 0, p: 0, listStyle: "none", gap: 2 }}>
            {owners.map((owner) => (
              <Box
                component="li"
                key={owner.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  p: 3,
                  borderRadius: 2,
                  bgcolor: "action.hover",
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>{owner.name}</Typography>
                <IconButton
                  aria-label={`${owner.name} 삭제`}
                  color="error"
                  onClick={() => {
                    setDeleteError("");
                    setPendingDelete(owner);
                  }}
                >
                  <DeleteOutlineIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>
        ) : (
          <Typography color="textSecondary" sx={{ mt: 4 }}>
            등록된 소유주가 없습니다.
          </Typography>
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
      </CardContent>
    </Card>
  );
}
