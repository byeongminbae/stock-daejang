import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { Brokerage, Owner } from "@/lib/api-contracts";

import { BrokerageCombobox } from "./BrokerageCombobox";
import { DateTimeInput } from "./DateTimeInput";
import { formatInteger, formatWon, numericSign } from "./format";
import { isIntegerDraft } from "./integer-input";
import { OwnerCombobox } from "./OwnerCombobox";
import { StockCombobox } from "./StockCombobox";
import { sideLabel, type TradeSide } from "./types";
import type { TradeFieldName, useTradeEntryForm } from "./useTradeEntryForm";

interface TradeEntryFieldsProps {
  readonly brokerages: readonly Brokerage[];
  readonly compact?: boolean;
  readonly favoriteBrokeragesByOwner?: Readonly<Record<string, readonly Brokerage[]>> | undefined;
  readonly form: ReturnType<typeof useTradeEntryForm>;
  readonly formId: string;
  readonly onCancel?: (() => void) | undefined;
  readonly owners: readonly Owner[];
  readonly side: TradeSide;
  readonly submitLabel: string;
}

export function TradeEntryFields({
  brokerages,
  compact = false,
  favoriteBrokeragesByOwner = {},
  form,
  formId,
  onCancel,
  owners,
  side,
  submitLabel,
}: TradeEntryFieldsProps) {
  const label = sideLabel(side);
  const fieldError = (name: TradeFieldName) => form.errors[name];
  const id = (name: string) => `${formId}-${name}`;
  const expectedProfitSign = form.expectedProfit === null ? null : numericSign(form.expectedProfit);
  const expectedProfitColor =
    expectedProfitSign === 1 ? "gain.main" : expectedProfitSign === -1 ? "loss.main" : undefined;
  const executedAtLabelId = id("executed-at-label");

  const summary = (
    <Stack sx={{ gap: 3, mt: compact ? 3 : 0 }}>
      <Box>
        <Typography color="textSecondary" variant="body2">
          {label}액
        </Typography>
        <Typography
          component="output"
          sx={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
          variant="h3"
        >
          {form.amount === null ? "-" : formatWon(form.amount)}
        </Typography>
      </Box>
      {side === "SELL" ? (
        <Box>
          <Typography color="textSecondary" variant="body2">
            {form.editing ? "손익 재계산" : "예상 손익"}
          </Typography>
          {form.editing ? (
            <Typography color="textSecondary" variant="body2">
              저장 시 거래 시각 순으로 이 매도와 이후 손익을 다시 계산합니다.
            </Typography>
          ) : (
            <Typography
              component="output"
              sx={{
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: expectedProfitColor,
              }}
              variant="h3"
            >
              {form.previewUnavailable
                ? "조회 실패"
                : form.expectedProfit === null
                  ? "-"
                  : formatWon(form.expectedProfit)}
            </Typography>
          )}
          {!form.editing && form.preview ? (
            <Typography color="textSecondary" sx={{ mt: 0.5 }} variant="body2">
              보유 {formatInteger(form.preview.heldQuantity)}주 · 평균{" "}
              {form.preview.averageBuyPrice ? formatWon(form.preview.averageBuyPrice) : "-"}
            </Typography>
          ) : null}
        </Box>
      ) : null}
      <Stack direction="row" sx={{ gap: 2, justifyContent: onCancel ? "flex-end" : "flex-start" }}>
        {onCancel ? (
          <Button disabled={form.submitting} onClick={onCancel} variant="outlined">
            취소
          </Button>
        ) : null}
        <Button disabled={form.submitting} type="submit" variant="contained">
          {form.submitting ? "저장 중" : submitLabel}
        </Button>
      </Stack>
    </Stack>
  );

  return (
    <>
      {form.message ? (
        <Alert
          ref={form.summaryRef}
          severity={form.messageTone === "error" ? "error" : "success"}
          sx={{ mb: 4 }}
          tabIndex={-1}
        >
          {form.message}
        </Alert>
      ) : null}
      <Box
        aria-busy={form.submitting}
        component="form"
        id={formId}
        noValidate
        onSubmit={form.handleSubmit}
        sx={{
          display: "grid",
          gap: 4,
          gridTemplateColumns: compact ? "1fr" : { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <Box sx={{ gridColumn: compact ? undefined : "1 / -1" }}>
          <Typography id={executedAtLabelId} sx={{ mb: 1.5, fontWeight: 700 }} variant="body2">
            {label} 일시
          </Typography>
          <DateTimeInput
            aria-describedby={`${id("datetime-hint")}${fieldError("executedAt") ? ` ${id("datetime-error")}` : ""}`}
            aria-invalid={fieldError("executedAt") ? true : undefined}
            aria-labelledby={executedAtLabelId}
            disabled={form.submitting}
            id={id("executed-at")}
            onChange={form.setExecutedAt}
            value={form.executedAt}
          />
          <Typography color="textSecondary" id={id("datetime-hint")} sx={{ mt: 1 }} variant="body2">
            한국시간 기준
          </Typography>
          {fieldError("executedAt") ? (
            <Typography color="error" id={id("datetime-error")} sx={{ mt: 0.5 }} variant="body2">
              {fieldError("executedAt")}
            </Typography>
          ) : null}
        </Box>
        <OwnerCombobox
          disabled={form.submitting}
          onChange={form.setOwnerId}
          owners={owners}
          value={form.ownerId}
        />
        <BrokerageCombobox
          brokerages={brokerages}
          disabled={form.submitting}
          error={fieldError("brokerageCode")}
          favoriteBrokerages={favoriteBrokeragesByOwner[form.ownerId] ?? []}
          onChange={form.setBrokerageCode}
          value={form.brokerageCode}
        />
        <Box sx={{ gridColumn: compact ? undefined : "1 / -1" }}>
          <StockCombobox
            disabled={form.submitting}
            error={fieldError("stock")}
            onChange={form.setStock}
            value={form.stock}
          />
        </Box>
        <TextField
          disabled={form.submitting}
          error={Boolean(fieldError("quantity"))}
          fullWidth
          helperText={fieldError("quantity")}
          id={id("quantity")}
          inputMode="numeric"
          label={`${label} 수량`}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (isIntegerDraft(value)) form.setQuantity(value);
          }}
          slotProps={fieldError("quantity") ? { formHelperText: { role: "alert" } } : undefined}
          value={form.quantity}
        />
        <TextField
          disabled={form.submitting}
          error={Boolean(fieldError("unitPrice"))}
          fullWidth
          helperText={fieldError("unitPrice")}
          id={id("price")}
          inputMode="numeric"
          label={`${label} 당시 단가`}
          onChange={(event) => {
            const value = event.currentTarget.value;
            if (isIntegerDraft(value)) form.setUnitPrice(value);
          }}
          slotProps={fieldError("unitPrice") ? { formHelperText: { role: "alert" } } : undefined}
          value={form.unitPrice}
        />
        <Box sx={{ gridColumn: compact ? undefined : "1 / -1" }}>{summary}</Box>
      </Box>
    </>
  );
}
