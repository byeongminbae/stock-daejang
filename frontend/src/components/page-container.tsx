import Box from "@mui/material/Box";
import type { ReactNode } from "react";

type PageContainerProps = Readonly<{
  children: ReactNode;
  stack?: boolean;
}>;

export function PageContainer({ children, stack = false }: PageContainerProps) {
  return (
    <Box
      sx={{
        maxWidth: 1440,
        mx: "auto",
        px: { xs: 3, sm: 6, lg: 8 },
        py: { xs: 5, sm: 6 },
        ...(stack ? { display: "grid", gap: { xs: 5, sm: 6 } } : {}),
      }}
    >
      {children}
    </Box>
  );
}
