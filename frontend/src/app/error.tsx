"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type DashboardErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <Box sx={{ maxWidth: 1440, mx: "auto", px: { xs: 3, sm: 6, lg: 8 }, py: 8 }}>
      <Paper
        component="section"
        role="alert"
        sx={{ p: { xs: 4, sm: 6 }, border: "1px solid", borderColor: "divider" }}
        variant="outlined"
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            alignItems: { xs: "stretch", sm: "flex-end" },
            justifyContent: "space-between",
            gap: 5,
          }}
        >
          <Box>
            <Typography
              sx={{ color: "primary.main", fontWeight: 800, letterSpacing: "0.04em" }}
              variant="body2"
            >
              DASHBOARD ERROR
            </Typography>
            <Typography component="h1" sx={{ mt: 1, mb: 2 }} variant="h1">
              보유 현황을 불러오지 못했습니다
            </Typography>
            <Typography sx={{ color: "text.secondary", maxWidth: "72ch" }}>
              데이터 또는 현재가를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
              입력된 거래 기록은 변경되지 않았습니다.
            </Typography>
          </Box>
          <Button onClick={reset} size="large" variant="contained">
            다시 시도
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
