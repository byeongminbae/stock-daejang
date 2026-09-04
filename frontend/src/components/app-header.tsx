"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "대시보드" },
  { href: "/record", label: "기록하기" },
  { href: "/buy-history", label: "매수 히스토리" },
  { href: "/sell-history", label: "매도 히스토리" },
  { href: "/settings", label: "설정" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <AppBar
      color="inherit"
      elevation={0}
      position="sticky"
      sx={{ borderBottom: "1px solid", borderColor: "divider" }}
    >
      <Box
        sx={{
          mx: "auto",
          width: "100%",
          maxWidth: 1440,
          px: { xs: 3, sm: 6, lg: 8 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            minHeight: 60,
          }}
        >
          <Box
            aria-label="우리집 주식대장 대시보드"
            component={Link}
            href="/"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 3,
              color: "text.primary",
              textDecoration: "none",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              whiteSpace: "nowrap",
              py: 2,
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                display: "grid",
                placeItems: "center",
                width: 28,
                height: 28,
                borderRadius: 2,
                bgcolor: "primary.light",
                color: "primary.dark",
                fontSize: "0.8125rem",
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              주
            </Box>
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              우리집 주식대장
            </Box>
          </Box>
        </Box>
        <Box aria-label="주요 메뉴" component="nav" sx={{ display: "flex" }}>
          {navigation.map((item) => {
            const isCurrent = pathname === item.href;
            return (
              <Box
                aria-current={isCurrent ? "page" : undefined}
                component={Link}
                href={item.href}
                key={item.href}
                sx={{
                  flex: "1 1 0",
                  minWidth: 0,
                  minHeight: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  px: 1,
                  color: isCurrent ? "primary.main" : "text.secondary",
                  fontWeight: 700,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  textAlign: "center",
                  textDecoration: "none",
                  borderBottom: "3px solid",
                  borderColor: isCurrent ? "primary.main" : "transparent",
                  "&:hover": { bgcolor: "action.hover", color: "text.primary" },
                }}
              >
                {item.label}
              </Box>
            );
          })}
        </Box>
      </Box>
    </AppBar>
  );
}
