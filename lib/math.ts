import Decimal from "decimal.js";

export const MON_TO_KG = new Decimal(40);

export function toDecimal(value: Decimal.Value) {
  return new Decimal(value);
}

export function calculatePerPieceSizeFactor(presentSizeMon: Decimal.Value) {
  const size = toDecimal(presentSizeMon);

  if (size.lte(0)) {
    throw new Error("Size must be greater than zero.");
  }

  return MON_TO_KG.div(size);
}

export function calculateInventoryWeightKg(quantity: Decimal.Value, presentSizeMon: Decimal.Value) {
  const itemQuantity = toDecimal(quantity);
  if (itemQuantity.lte(0)) {
    throw new Error("Quantity must be greater than zero.");
  }

  const factor = calculatePerPieceSizeFactor(presentSizeMon);
  const totalWeightKg = factor.mul(itemQuantity);

  return totalWeightKg.toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
}

export function calcTotalWeightKg(quantity: Decimal.Value, presentSizeMon: Decimal.Value) {
  return calculateInventoryWeightKg(quantity, presentSizeMon).toNumber();
}

export function calculateSalesPieceCount(totalSalesWeightKg: Decimal.Value, presentSizeMon: Decimal.Value) {
  const factor = calculatePerPieceSizeFactor(presentSizeMon);
  return toDecimal(totalSalesWeightKg).div(factor);
}

export function calculateFeedClosingBalance(
  openingBalance: Decimal.Value,
  additionAmount: Decimal.Value,
  dailyUse: Decimal.Value
) {
  return toDecimal(openingBalance).plus(additionAmount).minus(dailyUse).toDecimalPlaces(3, Decimal.ROUND_HALF_UP);
}

export function calcClosingBalance(openingBalance: Decimal.Value, additionAmount: Decimal.Value, dailyUse: Decimal.Value) {
  return calculateFeedClosingBalance(openingBalance, additionAmount, dailyUse).toNumber();
}

export function calcSalesPieces(totalSalesWeight: Decimal.Value, presentSizeMon: Decimal.Value) {
  return calculateSalesPieceCount(totalSalesWeight, presentSizeMon).toNumber();
}

export function runMathTests() {
  const first = calcTotalWeightKg(50_000, 30);
  const second = calcTotalWeightKg(70_000, 20);

  if (first !== 66_667) {
    throw new Error(`Math test 1 failed: expected 66667, got ${first}`);
  }

  if (second !== 140_000) {
    throw new Error(`Math test 2 failed: expected 140000, got ${second}`);
  }
}

export function ensureFiniteDecimal(value: Decimal) {
  if (!value.isFinite()) {
    throw new Error("Calculation produced a non-finite number.");
  }

  return value;
}