"use client";

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import type { Brokerage, Owner } from "@/lib/api-contracts";

import { TradeEntryFields } from "./TradeEntryFields";
import { sideLabel, type TradeSide } from "./types";
import { useTradeEntryForm } from "./useTradeEntryForm";

interface TradeEntryFormProps {
  readonly brokerages: readonly Brokerage[];
  readonly favoriteBrokeragesByOwner?: Readonly<Record<string, readonly Brokerage[]>> | undefined;
  readonly owners: readonly Owner[];
  readonly side: TradeSide;
  readonly onSaved?: ((tradeId: string) => void) | undefined;
}

export function TradeEntryForm({
  brokerages,
  favoriteBrokeragesByOwner,
  owners,
  side,
  onSaved,
}: TradeEntryFormProps) {
  const label = sideLabel(side);
  const form = useTradeEntryForm({
    defaultOwnerId: owners[0]?.id.toString() ?? "",
    side,
    onSaved,
  });

  return (
    <Card component="section" aria-labelledby={`${side}-entry-heading`} variant="outlined">
      <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
        <Typography component="h2" id={`${side}-entry-heading`} variant="h2">
          {label} 기록 추가
        </Typography>
        <Typography color="textSecondary" sx={{ mt: 1, mb: 4 }}>
          금액은 수량과 당시 단가로 자동 계산됩니다.
        </Typography>
        <TradeEntryFields
          brokerages={brokerages}
          favoriteBrokeragesByOwner={favoriteBrokeragesByOwner}
          form={form}
          formId={`${side}-create`}
          owners={owners}
          side={side}
          submitLabel={`${label} 기록 저장`}
        />
      </CardContent>
    </Card>
  );
}
