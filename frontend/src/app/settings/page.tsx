import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import { PageContainer } from "@/components/page-container";
import { FavoriteBrokeragesSettings } from "@/components/settings/FavoriteBrokeragesSettings";
import { OwnerSettings } from "@/components/settings/OwnerSettings";
import {
  listBrokerages,
  listFavoriteBrokeragesByOwner,
  listOwners,
} from "@/lib/server/stock-daejang-api";

export const metadata: Metadata = {
  title: "설정",
  description: "소유주별로 자주 쓰는 증권사를 관리합니다.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [brokerages, owners] = await Promise.all([listBrokerages(), listOwners()]);
  const favoriteBrokeragesByOwner = await listFavoriteBrokeragesByOwner(owners);

  return (
    <PageContainer stack>
      <Typography component="h1" variant="h1">
        설정
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: { xs: 5, sm: 6 },
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" },
        }}
      >
        <OwnerSettings owners={owners} />
        <FavoriteBrokeragesSettings
          brokerages={brokerages}
          favoriteBrokeragesByOwner={favoriteBrokeragesByOwner}
          owners={owners}
        />
      </Box>
    </PageContainer>
  );
}
