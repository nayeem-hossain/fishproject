/**
 * Fish Weight Calculation Engine
 * Constant: 1 Mon = 40 kg
 * Per Piece Size Factor = 40 / presentSize
 * Total Weight (kg) = perPieceSizeFactor * quantity
 * Sales Piece = totalSalesWeight / perPieceSizeFactor
 */

const MON_TO_KG = 40;

export function calcPerPieceSizeFactor(presentSize: number): number {
  if (presentSize <= 0) throw new Error("Size must be greater than 0");
  return MON_TO_KG / presentSize;
}

export function calcTotalWeightKg(quantity: number, sizeMon: number): number {
  if (quantity < 0) throw new Error("Quantity cannot be negative");
  const factor = calcPerPieceSizeFactor(sizeMon);
  return Math.round((factor * quantity * 1000) / 1000); // round to nearest kg
}

export function calcSalesPieces(
  totalSalesWeight: number,
  sizeMon: number
): number {
  const factor = calcPerPieceSizeFactor(sizeMon);
  return Math.round(totalSalesWeight / factor);
}

export function calcClosingBalance(
  openingBalance: number,
  additionAmount: number,
  dailyUse: number
): number {
  return openingBalance + additionAmount - dailyUse;
}

/**
 * Run verification tests. Throws if any test fails.
 * Must pass before any DB write in inventory actions.
 */
export function runMathTests(): void {
  const test1 = calcTotalWeightKg(50_000, 30);
  if (test1 !== 66_667) {
    throw new Error(
      `Math test 1 FAILED: expected 66667, got ${test1}`
    );
  }

  const test2 = calcTotalWeightKg(70_000, 20);
  if (test2 !== 140_000) {
    throw new Error(
      `Math test 2 FAILED: expected 140000, got ${test2}`
    );
  }
}

// Run tests at module load time in development
if (process.env.NODE_ENV !== "production") {
  try {
    runMathTests();
  } catch (e) {
    console.error("❌ MATH TEST FAILURE:", e);
    process.exit(1);
  }
}
