import type { History } from '../types';

const DAY_MS = 24 * 60 * 60 * 1000;

// 消費実績がこれだけないと推定の意味がないため、最低件数を設ける
const MIN_CONSUME_EVENTS = 3;

// 直近の消費イベントからこれだけ経過していたら、古いペースに基づく予測はもう
// 信頼できないとみなし「データ不足」扱いにする（鮮度チェック）
const STALE_THRESHOLD_DAYS = 45;

// 消費ペースを、Croston法（間欠需要向けの古典的な予測手法）に近い考え方で推定する（個/日）。
// GLM等の統計モデルは学習データが少なすぎて過学習しやすいため使わない。
//
// 過去に「日ごとのバケツ×指数移動平均（EMA）でカレンダー日単位に減衰させる」方式や
// 「直近lookbackDays日の単純合計÷日数」方式を試したが、どちらもラボの消耗品特有の
// 「まとめて使う→しばらく使わない」というバースト型の消費パターンに合わなかった
// （前者は未使用期間が続くと推定が0に潰れて破綻し、後者は窓内の直近の傾向を
// 十分に重視できない）。
//
// 「1回あたりの消費量」と「消費の間隔（日数）」を、カレンダー日ではなく実際の
// 消費イベント単位で捉え、推定ペース = 平均消費量 ÷ 平均間隔 とする。
// 消費パターンは大きく変化しない前提のため、直近を重視するEMA（固定alpha）ではなく
// 全イベントを均等に使う単純累積平均を採用する。データが増えるほど推定が
// 安定して真の値に収束していく（EMAだと直近数件だけで頭打ちになり、
// それ以上データが増えても精度が上がらない）。
export function estimateDailyConsumptionRate(histories: History[]): number | null {
  const events = histories
    .filter((h) => h.actionType === 'CONSUME' && h.amountChange < 0)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  if (events.length < MIN_CONSUME_EVENTS) return null;

  const lastEventAgeDays = (Date.now() - new Date(events[events.length - 1].timestamp).getTime()) / DAY_MS;
  if (lastEventAgeDays > STALE_THRESHOLD_DAYS) return null;

  let totalAmount = Math.abs(events[0].amountChange);
  let totalIntervalDays = 0;
  let prevTimestamp = new Date(events[0].timestamp).getTime();

  for (let i = 1; i < events.length; i++) {
    const ts = new Date(events[i].timestamp).getTime();
    totalAmount += Math.abs(events[i].amountChange);
    totalIntervalDays += Math.max((ts - prevTimestamp) / DAY_MS, 0.01);
    prevTimestamp = ts;
  }

  const avgAmount = totalAmount / events.length;
  const avgIntervalDays = totalIntervalDays / (events.length - 1);
  return avgAmount / avgIntervalDays;
}

export function estimateDaysUntilEmpty(quantity: number, histories: History[]): number | null {
  const rate = estimateDailyConsumptionRate(histories);
  if (rate === null || rate <= 0) return null;
  return quantity / rate;
}

export interface LeadTimeEstimate {
  avgDays: number;
  sampleCount: number;
}

// 発注(ORDERED)→入荷(ARRIVED)の実績ペアから平均リードタイム（日）を推定する。
// 貪欲法で「発注の直後に来た入荷」をペアにする（ステータス遷移は基本的に単純な順序で起きるため）。
export function estimateLeadTimeDays(histories: History[]): LeadTimeEstimate | null {
  const ordered = histories.filter((h) => h.actionType === 'ORDERED').sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const arrived = histories.filter((h) => h.actionType === 'ARRIVED').sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const deltasDays: number[] = [];
  let arrivedIdx = 0;
  for (const o of ordered) {
    while (arrivedIdx < arrived.length && arrived[arrivedIdx].timestamp <= o.timestamp) arrivedIdx++;
    if (arrivedIdx >= arrived.length) break;
    const deltaMs = new Date(arrived[arrivedIdx].timestamp).getTime() - new Date(o.timestamp).getTime();
    deltasDays.push(deltaMs / DAY_MS);
    arrivedIdx++;
  }

  if (deltasDays.length === 0) return null;
  return {
    avgDays: deltasDays.reduce((sum, d) => sum + d, 0) / deltasDays.length,
    sampleCount: deltasDays.length,
  };
}
