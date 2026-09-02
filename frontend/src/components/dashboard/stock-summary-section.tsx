import { stockImageUrl } from "@/lib/stock-image";

import styles from "./dashboard.module.css";
import {
  formatDashboardQuantity,
  formatDashboardWon,
  formatSignedWon,
  profitLabel,
} from "./format";
import type { DashboardStockSummary } from "./types";

type StockSummarySectionProps = Readonly<{
  stockSummaries: readonly DashboardStockSummary[];
}>;

export function StockSummarySection({ stockSummaries }: StockSummarySectionProps) {
  return (
    <section
      className={`${styles.summary} ${styles.stockSummarySection}`}
      aria-labelledby="stock-summary-heading"
    >
      <div className={styles.summaryHeading}>
        <div>
          <h2 id="stock-summary-heading">우리집 주식 보유 현황</h2>
        </div>
      </div>

      <div className={`desktop-only ${styles.tableWrap}`}>
        <table className={`${styles.table} ${styles.stockSummaryTable}`}>
          <caption className="sr-only">전체 종목별 보유 현황</caption>
          <thead>
            <tr>
              <th scope="col">종목</th>
              <th scope="col">보유 수량</th>
              <th scope="col">매입액</th>
              <th scope="col">현재가</th>
              <th scope="col">평가 손익</th>
              <th scope="col">평가액</th>
            </tr>
          </thead>
          <tbody>
            {stockSummaries.map((stock) => {
              const profitState = profitLabel(stock.unrealizedProfit);
              const profitClass =
                profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";
              return (
                <tr key={stock.stockCode}>
                  <th scope="row">
                    <div className={styles.stockIdentity}>
                      {/* biome-ignore lint/performance/noImgElement: external hotlinked SVG, avoids next/image's dangerouslyAllowSVG */}
                      <img
                        alt=""
                        className={styles.stockLogo}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.style.display = "none";
                        }}
                        src={stockImageUrl(stock.stockCode)}
                      />
                      <span>
                        <span className={styles.stockName}>{stock.stockName}</span>
                        <span className={styles.stockCode}>{stock.stockCode}</span>
                      </span>
                    </div>
                  </th>
                  <td className="money">{formatDashboardQuantity(stock.quantity)}</td>
                  <td className="money">{formatDashboardWon(stock.totalBuyAmount)}</td>
                  <td className="money">{formatDashboardWon(stock.currentPrice)}</td>
                  <td className={`money ${profitClass}`}>
                    <span className="sr-only">{profitState} </span>
                    {formatSignedWon(stock.unrealizedProfit)}
                  </td>
                  <td className="money">{formatDashboardWon(stock.valuation)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ul className={`compact-only card-grid ${styles.cards}`} aria-label="전체 종목별 보유 현황">
        {stockSummaries.map((stock) => {
          const profitState = profitLabel(stock.unrealizedProfit);
          const profitClass =
            profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";
          return (
            <li key={stock.stockCode}>
              <article className={styles.card}>
                <header className={styles.cardHeader}>
                  <div className={styles.stockIdentity}>
                    {/* biome-ignore lint/performance/noImgElement: external hotlinked SVG, avoids next/image's dangerouslyAllowSVG */}
                    <img
                      alt=""
                      className={styles.stockLogo}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                      src={stockImageUrl(stock.stockCode)}
                    />
                    <h3>{stock.stockName}</h3>
                  </div>
                  <p>{stock.stockCode}</p>
                </header>
                <dl className={styles.metricGrid}>
                  <div>
                    <dt>보유 수량</dt>
                    <dd className="money">{formatDashboardQuantity(stock.quantity)}</dd>
                  </div>
                  <div>
                    <dt>매입액</dt>
                    <dd className="money">{formatDashboardWon(stock.totalBuyAmount)}</dd>
                  </div>
                  <div>
                    <dt>현재가</dt>
                    <dd className="money">{formatDashboardWon(stock.currentPrice)}</dd>
                  </div>
                  <div>
                    <dt>평가 손익</dt>
                    <dd className={`money ${profitClass}`}>
                      <span className="sr-only">{profitState} </span>
                      {formatSignedWon(stock.unrealizedProfit)}
                    </dd>
                  </div>
                  <div>
                    <dt>평가액</dt>
                    <dd className="money">{formatDashboardWon(stock.valuation)}</dd>
                  </div>
                </dl>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
