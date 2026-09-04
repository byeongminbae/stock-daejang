import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { PageContainer } from "@/components/page-container";

export function PrimitiveShowcase() {
  return (
    <PageContainer stack>
      <Box aria-labelledby="primitive-showcase-title" component="header">
        <Typography
          sx={{ color: "primary.main", fontWeight: 800, letterSpacing: "0.04em" }}
          variant="body2"
        >
          개발용 상태 하네스
        </Typography>
        <Typography component="h1" id="primitive-showcase-title" sx={{ mt: 1 }} variant="h1">
          공통 UI 프리미티브
        </Typography>
        <Typography sx={{ mt: 1, maxWidth: "72ch", color: "text.secondary" }}>
          제품 화면을 추가하기 전에 밝기, 상태, 포커스와 숫자 표현을 확인합니다.
        </Typography>
      </Box>

      <Box
        aria-labelledby="showcase-actions-title"
        component="section"
        sx={{ display: "grid", gap: 4 }}
      >
        <Typography component="h2" id="showcase-actions-title" variant="h2">
          버튼과 상태
        </Typography>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 3 }}>
          <Button variant="contained">기록 저장</Button>
          <Button variant="outlined">검색 적용</Button>
          <Button variant="text">초기화</Button>
          <Button color="error" variant="outlined">
            기록 삭제
          </Button>
          <Button disabled variant="contained">
            저장 중
          </Button>
        </Stack>
        <Stack sx={{ gap: 2 }}>
          <Alert severity="info">현재가는 페이지를 열 때 새로 조회합니다.</Alert>
          <Alert severity="success">매수 기록이 저장되었습니다.</Alert>
          <Alert severity="warning">일부 종목의 현재가를 가져오지 못했습니다.</Alert>
          <Alert severity="error">저장하지 못했습니다. 입력값을 확인해 주세요.</Alert>
        </Stack>
      </Box>

      <Box
        aria-labelledby="showcase-inputs-title"
        component="section"
        sx={{ display: "grid", gap: 4 }}
      >
        <Typography component="h2" id="showcase-inputs-title" variant="h2">
          입력과 숫자
        </Typography>
        <Box
          sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 4 }}
        >
          <TextField
            label="종목명"
            required
            slotProps={{ input: { readOnly: true } }}
            value="삼성전자"
          />
          <TextField
            helperText="원 단위 양의 정수"
            label="당시 단가"
            slotProps={{ input: { readOnly: true } }}
            value="72,100"
          />
          <TextField
            error
            helperText="수량은 1주 이상 입력해 주세요."
            label="수량"
            slotProps={{ input: { readOnly: true } }}
            value="0"
          />
        </Box>
        <Box
          component="dl"
          sx={{
            m: 0,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          <Box sx={{ p: 3, borderRadius: 2, bgcolor: "action.hover" }}>
            <Typography component="dt" sx={{ color: "text.secondary" }} variant="body2">
              평가손익
            </Typography>
            <Typography
              component="dd"
              sx={{ m: 0, color: "gain.main", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
            >
              +630,000원
            </Typography>
          </Box>
          <Box sx={{ p: 3, borderRadius: 2, bgcolor: "action.hover" }}>
            <Typography component="dt" sx={{ color: "text.secondary" }} variant="body2">
              실현손익
            </Typography>
            <Typography
              component="dd"
              sx={{ m: 0, color: "loss.main", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}
            >
              -255,000원
            </Typography>
          </Box>
          <Box sx={{ p: 3, borderRadius: 2, bgcolor: "action.hover" }}>
            <Typography component="dt" sx={{ color: "text.secondary" }} variant="body2">
              조회 실패
            </Typography>
            <Typography component="dd" sx={{ m: 0, fontVariantNumeric: "tabular-nums" }}>
              -
            </Typography>
          </Box>
        </Box>
      </Box>
    </PageContainer>
  );
}
