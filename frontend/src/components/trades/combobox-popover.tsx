"use client";

import Paper from "@mui/material/Paper";
import Popper from "@mui/material/Popper";
import type { ReactNode } from "react";

type ComboboxPopoverProps = Readonly<{
  anchorEl: HTMLElement | null;
  open: boolean;
  id: string;
  role: "listbox" | "dialog";
  ariaLabel?: string;
  children: ReactNode;
}>;

export function ComboboxPopover({
  anchorEl,
  open,
  id,
  role,
  ariaLabel,
  children,
}: ComboboxPopoverProps) {
  return (
    <Popper anchorEl={anchorEl} open={open} placement="bottom-start" style={{ zIndex: 1300 }}>
      <Paper
        aria-label={ariaLabel}
        elevation={4}
        id={id}
        onMouseDown={(event) => event.preventDefault()}
        role={role}
        sx={{
          mt: 1,
          width: anchorEl ? anchorEl.offsetWidth : undefined,
          maxHeight: "40dvh",
          overflowY: "auto",
          py: 1,
        }}
      >
        {children}
      </Paper>
    </Popper>
  );
}
