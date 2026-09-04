import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Typography from "@mui/material/Typography";

import { StockSummaryCards, StockSummaryTable } from "./stock-summary-table";
import type { DashboardStockSummary } from "./types";

type StockSummarySectionProps = Readonly<{
  stockSummaries: readonly DashboardStockSummary[];
}>;

export function StockSummarySection({ stockSummaries }: StockSummarySectionProps) {
  return (
    <Card component="section" aria-labelledby="stock-summary-heading" variant="outlined">
      <CardHeader
        sx={{ pb: 0 }}
        title={
          <Typography component="h2" id="stock-summary-heading" variant="h2">
            우리집 주식 보유 현황
          </Typography>
        }
      />
      <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
        <StockSummaryTable ariaLabel="전체 종목별 보유 현황" stockSummaries={stockSummaries} />
        <StockSummaryCards ariaLabel="전체 종목별 보유 현황" stockSummaries={stockSummaries} />
      </CardContent>
    </Card>
  );
}
