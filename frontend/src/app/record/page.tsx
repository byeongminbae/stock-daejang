import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/page-container";
import { TradeEntryForm } from "@/components/trades";
import {
  listBrokerages,
  listFavoriteBrokeragesByOwner,
  listOwners,
} from "@/lib/server/stock-daejang-api";

export const metadata: Metadata = {
  title: "기록하기",
  description: "가족별 국내 주식 매수·매도 기록을 한곳에서 추가합니다.",
};

export const dynamic = "force-dynamic";

export default async function RecordPage() {
  const [brokerages, owners] = await Promise.all([listBrokerages(), listOwners()]);
  if (owners.length === 0) redirect("/settings");
  const favoriteBrokeragesByOwner = await listFavoriteBrokeragesByOwner(owners);

  return (
    <PageContainer stack>
      <Typography component="h1" variant="h1">
        기록하기
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: { xs: 5, sm: 6 },
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        }}
      >
        <TradeEntryForm
          brokerages={brokerages}
          favoriteBrokeragesByOwner={favoriteBrokeragesByOwner}
          owners={owners}
          side="BUY"
        />
        <TradeEntryForm
          brokerages={brokerages}
          favoriteBrokeragesByOwner={favoriteBrokeragesByOwner}
          owners={owners}
          side="SELL"
        />
      </Box>
    </PageContainer>
  );
}
