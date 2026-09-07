import { db } from "@workspace/db";
import { marketingOrderCounterTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const COUNTER_ID = 1;
const DAY_MS = 24 * 60 * 60 * 1000;

type CounterRow = typeof marketingOrderCounterTable.$inferSelect;

function chooseDailyIncrease(minimum: number, maximum: number) {
  return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
}

function displayedValue(row: CounterRow, now = new Date()) {
  if (!row.enabled) return row.currentValue;
  const elapsed = Math.max(0, now.getTime() - row.cycleStartedAt.getTime());
  const progress = Math.min(1, elapsed / DAY_MS);
  return row.currentValue + Math.floor(row.dailyIncrease * progress);
}

export async function getMarketingOrderCounter() {
  return db.transaction(async (tx) => {
    let [row] = await tx.select().from(marketingOrderCounterTable).where(eq(marketingOrderCounterTable.id, COUNTER_ID)).for("update");
    if (!row) {
      [row] = await tx.insert(marketingOrderCounterTable).values({ id: COUNTER_ID }).returning();
    }

    const now = new Date();
    const elapsed = Math.max(0, now.getTime() - row.cycleStartedAt.getTime());
    const completedDays = row.enabled ? Math.floor(elapsed / DAY_MS) : 0;
    if (completedDays > 0) {
      const updatedValue = row.currentValue + row.dailyIncrease * completedDays;
      const updatedStart = new Date(row.cycleStartedAt.getTime() + completedDays * DAY_MS);
      [row] = await tx.update(marketingOrderCounterTable)
        .set({
          currentValue: updatedValue,
          dailyIncrease: chooseDailyIncrease(row.minDailyIncrease, row.maxDailyIncrease),
          cycleStartedAt: updatedStart,
          updatedAt: now,
        })
        .where(eq(marketingOrderCounterTable.id, COUNTER_ID))
        .returning();
    }

    return { ...row, displayedValue: displayedValue(row, now) };
  });
}

export async function updateMarketingOrderCounter(input: {
  currentValue: number;
  minDailyIncrease: number;
  maxDailyIncrease: number;
  enabled: boolean;
  resetDailyCycle?: boolean;
}) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select().from(marketingOrderCounterTable).where(eq(marketingOrderCounterTable.id, COUNTER_ID)).for("update");
    const now = new Date();
    const [row] = await tx.update(marketingOrderCounterTable)
      .set({
        currentValue: input.currentValue,
        minDailyIncrease: input.minDailyIncrease,
        maxDailyIncrease: input.maxDailyIncrease,
        enabled: input.enabled,
        ...(input.resetDailyCycle || current?.minDailyIncrease !== input.minDailyIncrease || current?.maxDailyIncrease !== input.maxDailyIncrease
          ? { dailyIncrease: chooseDailyIncrease(input.minDailyIncrease, input.maxDailyIncrease), cycleStartedAt: now }
          : {}),
        updatedAt: now,
      })
      .where(eq(marketingOrderCounterTable.id, COUNTER_ID))
      .returning();

    return { ...row, displayedValue: displayedValue(row, now) };
  });
}