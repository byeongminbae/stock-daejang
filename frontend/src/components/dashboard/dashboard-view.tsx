"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { SHOW_BROKERAGE_TOTALS_COOKIE } from "./brokerage-totals-cookie";
import styles from "./dashboard.module.css";
import { OwnerSection } from "./owner-section";
import { StockSummarySection } from "./stock-summary-section";
import { SummaryStrip } from "./summary-strip";
import type { DashboardResponse } from "./types";

type DashboardViewProps = Readonly<{
  dashboard: DashboardResponse;
  initialShowBrokerageTotals: boolean;
}>;

const SHOW_BROKERAGE_TOTALS_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export function DashboardView({ dashboard, initialShowBrokerageTotals }: DashboardViewProps) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [showBrokerageTotals, setShowBrokerageTotals] = useState(initialShowBrokerageTotals);
  const isEmpty = dashboard.stockCount === 0;

  function refreshPrices() {
    startRefresh(() => router.refresh());
  }

  function toggleBrokerageTotals() {
    setShowBrokerageTotals((current) => {
      const next = !current;
      // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API isn't supported in every browser yet.
      document.cookie = `${SHOW_BROKERAGE_TOTALS_COOKIE}=${next}; path=/; max-age=${SHOW_BROKERAGE_TOTALS_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
      return next;
    });
  }

  return (
    <div className="page-frame">
      <header className={`page-header ${styles.pageHeader}`}>
        <div>
          <h1 className="page-title">대시보드</h1>
        </div>
        <div className={styles.headerActions}>
          <button
            className="button button--secondary"
            type="button"
            onClick={toggleBrokerageTotals}
            aria-pressed={showBrokerageTotals}
          >
            {showBrokerageTotals ? "증권사 합계 숨기기" : "증권사 합계 보기"}
          </button>
          <Link className="button button--primary" href="/record">
            매수 기록 추가
          </Link>
        </div>
      </header>

      <SummaryStrip dashboard={dashboard} refreshing={refreshing} onRefresh={refreshPrices} />

      {isEmpty ? (
        <aside className={styles.firstTrade}>
          <div>
            <h2>아직 기록된 보유 종목이 없습니다</h2>
            <p>첫 매수 기록을 남기면 이곳에서 가족별 현황을 볼 수 있습니다.</p>
          </div>
          <Link className="button button--primary" href="/record">
            첫 매수 기록 추가
          </Link>
        </aside>
      ) : null}

      {isEmpty ? null : <StockSummarySection stockSummaries={dashboard.stockSummaries} />}

      <div className={styles.ownerStack} aria-busy={refreshing}>
        {dashboard.owners.map((owner) => (
          <OwnerSection
            key={owner.ownerId}
            owner={owner}
            showBrokerageTotals={showBrokerageTotals}
          />
        ))}
      </div>
    </div>
  );
}
