"use client";

import Box from "@mui/material/Box";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface HistoryPaginationProps {
  readonly page: number;
  readonly totalPages: number;
}

export function HistoryPagination({ page, totalPages }: HistoryPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (totalPages <= 1) return null;

  const hrefFor = (nextPage: number): string => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <Box
      aria-label="거래 내역 페이지"
      component="nav"
      sx={{ display: "flex", justifyContent: "center" }}
    >
      <Pagination
        count={totalPages}
        page={page}
        renderItem={(item) => (
          <PaginationItem component={Link} href={hrefFor(item.page ?? 1)} {...item} />
        )}
      />
    </Box>
  );
}
