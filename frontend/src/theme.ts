import { koKR } from "@mui/material/locale";
import { createTheme } from "@mui/material/styles";

const koreanFontStack = '"Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';

declare module "@mui/material/styles" {
  interface Palette {
    gain: Palette["error"];
    loss: Palette["error"];
    owner: readonly [string, string, string];
  }
  interface PaletteOptions {
    gain?: PaletteOptions["error"];
    loss?: PaletteOptions["error"];
    owner?: readonly [string, string, string];
  }
}

export const theme = createTheme(
  {
    palette: {
      mode: "light",
      primary: {
        main: "#0E7C6B",
        light: "#3E9C8D",
        dark: "#0A5C4F",
        contrastText: "#ffffff",
      },
      background: {
        default: "#F6F7F9",
        paper: "#ffffff",
      },
      text: {
        primary: "#181F2A",
        secondary: "#5B6472",
      },
      divider: "#E2E6EC",
      error: {
        main: "#C6293F",
      },
      warning: {
        main: "#946200",
      },
      gain: {
        main: "#C6293F",
        light: "#FBE9EB",
      },
      loss: {
        main: "#1F5FD1",
        light: "#E9F0FD",
      },
      owner: ["#C2740C", "#7C3AED", "#2F8F5B"],
    },
    shape: {
      borderRadius: 10,
    },
    typography: {
      fontFamily: koreanFontStack,
      h1: { fontSize: "clamp(1.625rem, 2.5vw, 2rem)", fontWeight: 800, letterSpacing: "-0.03em" },
      h2: { fontSize: "1.375rem", fontWeight: 800, letterSpacing: "-0.02em" },
      h3: { fontSize: "1.125rem", fontWeight: 700 },
      body1: { fontSize: "0.9375rem" },
      body2: { fontSize: "0.8125rem" },
      button: { fontWeight: 700, textTransform: "none" },
    },
    breakpoints: {
      values: { xs: 0, sm: 640, md: 768, lg: 1120, xl: 1440 },
    },
    spacing: 4,
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          html: { fontSynthesis: "none", textSizeAdjust: "100%" },
          body: { overflowWrap: "break-word", wordBreak: "keep-all" },
          "*, *::before, *::after": { boxSizing: "border-box" },
        },
      },
      MuiButtonBase: {
        defaultProps: { disableRipple: false },
        styleOverrides: {
          root: { minHeight: 44 },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { minHeight: 44, minWidth: 44, paddingInline: 16, borderRadius: 8 },
          sizeSmall: { minHeight: 40 },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { minWidth: 44, minHeight: 44, borderRadius: 8 },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: { minHeight: 44 },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: { minHeight: 44, fontWeight: 700 },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: { padding: 10 },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: "1px solid #E2E6EC",
            boxShadow: "0 1px 2px rgb(24 32 45 / 4%)",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: "none" },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { minHeight: 32, fontWeight: 600 },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: { fontVariantNumeric: "tabular-nums" },
        },
      },
    },
  },
  koKR,
);
