import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { visuallyHidden } from "@/lib/visually-hidden";

export default function AppLoading() {
  return (
    <Box
      aria-busy="true"
      aria-live="polite"
      sx={{ maxWidth: 1440, mx: "auto", px: { xs: 3, sm: 6, lg: 8 }, py: 8 }}
    >
      <span role="status" style={visuallyHidden}>
        페이지 불러오는 중
      </span>
      <Box aria-hidden="true" sx={{ display: "grid", gap: 4 }}>
        {[0, 1, 2, 3].map((key) => (
          <Skeleton height={140} key={key} variant="rounded" />
        ))}
      </Box>
    </Box>
  );
}
