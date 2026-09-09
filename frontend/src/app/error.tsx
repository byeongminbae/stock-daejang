"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type AppErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function AppError({ reset }: AppErrorProps) {
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
              ERROR
            </Typography>
            <Typography component="h1" sx={{ mt: 1, mb: 2 }} variant="h1">
              문제가 발생했습니다
            </Typography>
            <Typography sx={{ color: "text.secondary", maxWidth: "72ch" }}>
              요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. 입력한 내용은
              저장되지 않았을 수 있습니다.
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
