"use client";

import ky, { type KyResponse } from "ky";
import { useState } from "react";
import { z } from "zod";
import { BrokerageCombobox } from "@/components/trades/BrokerageCombobox";
import type { Brokerage, Owner } from "@/lib/api-contracts";
import styles from "./favorite-brokerages-settings.module.css";

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
    <div className={styles.row}>
      <span className={styles.ownerName}>{owner.name}</span>
      <div className={styles.comboboxSlot}>
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
      </div>
      <div className={styles.chips}>
        {favorites.map((brokerage) => (
          <button
            className={styles.chip}
            disabled={pending}
            key={brokerage.code}
            onClick={() => void removeFavorite(brokerage.code)}
            type="button"
          >
            {brokerage.name} <span aria-hidden="true">×</span>
          </button>
        ))}
      </div>
      {error ? <p className={styles.error}>{error}</p> : null}
    </div>
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
    <section aria-labelledby="favorite-brokerages-heading" className="panel">
      <h2 id="favorite-brokerages-heading">자주 쓰는 증권사</h2>
      <div className={styles.ownerRows}>
        {owners.map((owner) => (
          <OwnerFavoritesRow
            brokerages={brokerages}
            initialFavorites={favoriteBrokeragesByOwner[owner.id.toString()] ?? []}
            key={owner.id}
            owner={owner}
          />
        ))}
      </div>
    </section>
  );
}
