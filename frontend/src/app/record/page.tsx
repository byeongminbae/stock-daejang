import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { TradeEntryForm } from "@/components/trades";
import {
  listBrokerages,
  listFavoriteBrokeragesByOwner,
  listOwners,
} from "@/lib/server/stock-daejang-api";

import styles from "./record.module.css";

export const metadata: Metadata = {
  title: "기록하기",
  description: "가족별 국내 주식 매수·매도 기록을 한곳에서 추가합니다.",
};

export const dynamic = "force-dynamic";

export default async function RecordPage() {
  const [brokerages, owners] = await Promise.all([listBrokerages(), listOwners()]);
  if (owners.length === 0) redirect("/settings");
  const favoriteBrokeragesByOwner = await listFavoriteBrokeragesByOwner(owners);

  return (
    <div className="page-frame page-stack">
      <header className="page-intro">
        <h1 className="page-title">기록하기</h1>
      </header>

      <div className={styles.entryGrid}>
        <TradeEntryForm
          brokerages={brokerages}
          favoriteBrokeragesByOwner={favoriteBrokeragesByOwner}
          owners={owners}
          side="BUY"
        />
        <TradeEntryForm
          brokerages={brokerages}
          favoriteBrokeragesByOwner={favoriteBrokeragesByOwner}
          owners={owners}
          side="SELL"
        />
      </div>
    </div>
  );
}
