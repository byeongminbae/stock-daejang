import type { Metadata } from "next";

import { FavoriteBrokeragesSettings } from "@/components/settings/FavoriteBrokeragesSettings";
import {
  listBrokerages,
  listFavoriteBrokeragesByOwner,
  listOwners,
} from "@/lib/server/stock-daejang-api";

export const metadata: Metadata = {
  title: "설정",
  description: "소유주별로 자주 쓰는 증권사를 관리합니다.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [brokerages, owners] = await Promise.all([listBrokerages(), listOwners()]);
  const favoriteBrokeragesByOwner = await listFavoriteBrokeragesByOwner(owners);

  return (
    <div className="page-frame page-stack">
      <header className="page-intro">
        <h1 className="page-title">설정</h1>
      </header>
      <FavoriteBrokeragesSettings
        brokerages={brokerages}
        favoriteBrokeragesByOwner={favoriteBrokeragesByOwner}
        owners={owners}
      />
    </div>
  );
}
