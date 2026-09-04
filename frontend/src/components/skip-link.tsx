"use client";

import MuiLink from "@mui/material/Link";

export function SkipLink() {
  return (
    <MuiLink
      href="#main-content"
      sx={{
        position: "fixed",
        top: 12,
        left: 12,
        zIndex: 100,
        px: 4,
        py: 2,
        borderRadius: 2,
        bgcolor: "text.primary",
        color: "background.paper",
        fontWeight: 700,
        textDecoration: "none",
        clipPath: "inset(50%)",
        transform: "translateY(-160%)",
        "&:focus-visible": {
          clipPath: "none",
          transform: "translateY(0)",
        },
      }}
    >
      본문으로 건너뛰기
    </MuiLink>
  );
}
