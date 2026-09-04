"use client";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ky, { type KyResponse } from "ky";
import { useState } from "react";
import { z } from "zod";

import { BrokerageCombobox } from "@/components/trades/BrokerageCombobox";
import type { Brokerage, Owner } from "@/lib/api-contracts";

const errorResponseSchema = z.object({
  success: z.literal(false),
  timestamp: z.string(),
  statusCode: z.string(),
  message: z.string(),
});
const mutationResponseSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true), timestamp: z.string() }),
  errorResponseSchema,
]);

interface OwnerFavoritesRowProps {
  readonly owner: Owner;
  readonly brokerages: readonly Brokerage[];
  readonly initialFavorites: readonly Brokerage[];
}

function OwnerFavoritesRow({ owner, brokerages, initialFavorites }: OwnerFavoritesRowProps) {
  const [favorites, setFavorites] = useState<readonly Brokerage[]>(initialFavorites);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const favoriteCodes = new Set(favorites.map((brokerage) => brokerage.code));
  const addableBrokerages = brokerages.filter((brokerage) => !favoriteCodes.has(brokerage.code));

  const mutate = async (
    optimisticFavorites: readonly Brokerage[],
    request: () => Promise<KyResponse>,
    failMessage: string,
  ) => {
    const previousFavorites = favorites;
    setFavorites(optimisticFavorites);
    setPending(true);
    setError("");
    try {
      const response = await request();
      const result = mutationResponseSchema.parse(await response.json<unknown>());
      if (!response.ok || !result.success) {
        setFavorites(previousFavorites);
        setError(result.success ? failMessage : result.message);
      }
    } catch {
      setFavorites(previousFavorites);
      setError(failMessage);
    } finally {
      setPending(false);
    }
  };

  const addFavorite = (brokerage: Brokerage) =>
    mutate(
      [...favorites, brokerage],
      () =>
        ky.post(`/api/v1/owners/${owner.id}/brokerages/${brokerage.code}`, {
          throwHttpErrors: false,
          timeout: 10_000,
        }),
      "추가하지 못했습니다.",
    );

  const removeFavorite = (code: string) =>
    mutate(
      favorites.filter((item) => item.code !== code),
      () =>
        ky.delete(`/api/v1/owners/${owner.id}/brokerages/${code}`, {
          throwHttpErrors: false,
          timeout: 10_000,
        }),
      "삭제하지 못했습니다.",
    );

  return (
    <Box
      sx={{
        py: 3,
        borderTop: "1px solid",
        borderColor: "divider",
        "&:first-of-type": { pt: 0, borderTop: "none" },
      }}
    >
      <Typography sx={{ fontWeight: 700, mb: 2 }}>{owner.name}</Typography>
      <BrokerageCombobox
        brokerages={addableBrokerages}
        disabled={pending}
        favoriteBrokerages={[]}
        hideLabel
        key={favorites.length}
        onChange={(code) => {
          const brokerage = addableBrokerages.find((item) => item.code === code);
          if (brokerage) void addFavorite(brokerage);
        }}
        placeholder="증권사 추가"
        value=""
      />
      {favorites.length > 0 ? (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 2, mt: 3 }}>
          {favorites.map((brokerage) => (
            <Chip
              disabled={pending}
              key={brokerage.code}
              label={brokerage.name}
              onDelete={() => void removeFavorite(brokerage.code)}
            />
          ))}
        </Stack>
      ) : null}
      {error ? (
        <Typography color="error" sx={{ mt: 2 }} variant="body2">
          {error}
        </Typography>
      ) : null}
    </Box>
  );
}

interface FavoriteBrokeragesSettingsProps {
  readonly owners: readonly Owner[];
  readonly brokerages: readonly Brokerage[];
  readonly favoriteBrokeragesByOwner: Readonly<Record<string, readonly Brokerage[]>>;
}

export function FavoriteBrokeragesSettings({
  owners,
  brokerages,
  favoriteBrokeragesByOwner,
}: FavoriteBrokeragesSettingsProps) {
  return (
    <Card component="section" aria-labelledby="favorite-brokerages-heading" variant="outlined">
      <CardContent sx={{ p: { xs: 4, sm: 5 } }}>
        <Typography component="h2" id="favorite-brokerages-heading" sx={{ mb: 4 }} variant="h2">
          자주 쓰는 증권사
        </Typography>
        <Box>
          {owners.map((owner) => (
            <OwnerFavoritesRow
              brokerages={brokerages}
              initialFavorites={favoriteBrokeragesByOwner[owner.id.toString()] ?? []}
              key={owner.id}
              owner={owner}
            />
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
