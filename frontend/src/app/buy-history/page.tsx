import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { PageContainer } from "@/components/page-container";
import { HistoryFilters, HistoryPagination, TradeHistory } from "@/components/trades";
import {
  listBrokerages,
  listFavoriteBrokeragesByOwner,
  listOwners,
  listPurchasedStocks,
  listTradeHistory,
} from "@/lib/server/stock-daejang-api";

export const metadata: Metadata = {
  title: "매수 히스토리",
  description: "가족별 국내 주식 매수 기록을 기간, 종목, 소유주, 증권사로 검색합니다.",
};

export const dynamic = "force-dynamic";

type BuyHistoryPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function BuyHistoryPage({ searchParams }: BuyHistoryPageProps) {
  const rawSearchParams = await searchParams;
  const [result, brokerages, owners, stocks] = await Promise.all([
    listTradeHistory("BUY", rawSearchParams),
    listBrokerages(),
    listOwners(),
    listPurchasedStocks("BUY"),
  ]);
  if (owners.length === 0) redirect("/settings");
  const showFilteredEmptyState = result.hasFilters && result.rows.length === 0 && stocks.length > 0;
  const favoriteBrokeragesByOwner = await listFavoriteBrokeragesByOwner(owners);

  return (
    <PageContainer stack>
      <Typography component="h1" variant="h1">
        매수 히스토리
      </Typography>

      <Box component="section" aria-labelledby="buy-history-title">
        <Stack
          direction="row"
          sx={{ alignItems: "flex-end", justifyContent: "space-between", gap: 3, mb: 3 }}
        >
          <Typography component="h2" id="buy-history-title" variant="h2">
            매수 기록 검색
          </Typography>
          <Typography aria-live="polite" color="textSecondary" role="status" variant="body2">
            {result.hasFilters
              ? `검색 결과 ${result.total.toLocaleString("ko-KR")}건`
              : `전체 ${result.total.toLocaleString("ko-KR")}건`}
          </Typography>
        </Stack>

        <Suspense fallback={<Typography role="status">매수 필터를 불러오는 중입니다.</Typography>}>
          <HistoryFilters
            brokerages={brokerages}
            favoriteBrokeragesByOwner={favoriteBrokeragesByOwner}
            owners={owners}
            stocks={stocks}
            side="BUY"
          />
        </Suspense>
        <TradeHistory
          side="BUY"
          rows={result.rows}
          total={result.total}
          hasFilters={showFilteredEmptyState}
          brokerages={brokerages}
          owners={owners}
        />
        <Suspense fallback={null}>
          <Box sx={{ mt: 4 }}>
            <HistoryPagination page={result.currentPage} totalPages={result.totalPages} />
          </Box>
        </Suspense>
      </Box>
    </PageContainer>
  );
}
