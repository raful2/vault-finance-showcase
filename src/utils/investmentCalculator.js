/**
 * Investment Calculation, Allocation Rebalancing, and Dividend Forecaster Engine
 */

export const ASSET_CLASS_LABELS = {
  stock: 'Individual Stocks',
  etf: 'ETFs & Index Funds',
  crypto: 'Cryptocurrency',
  bond: 'Bonds & Fixed Income',
  real_estate: 'Real Estate & REITs',
  other: 'Other Assets'
};

export const ASSET_CLASS_COLORS = {
  stock: '#3b82f6',     // Blue
  etf: '#0284c7',       // Sky
  crypto: '#f59e0b',    // Amber
  bond: '#10b981',      // Emerald
  real_estate: '#8b5cf6', // Violet
  other: '#64748b'      // Slate
};

/**
 * Perform comprehensive calculations across all investment holdings
 */
export function analyzePortfolio(holdings = []) {
  if (!holdings || holdings.length === 0) {
    return {
      totalValue: 0,
      totalCost: 0,
      totalGainLoss: 0,
      totalGainLossPct: 0,
      annualDividendTotal: 0,
      portfolioYieldPct: 0,
      holdingsCount: 0,
      classBreakdown: [],
      rebalancingList: [],
      monthlyDividendProjection: Array(12).fill(0),
      topGainers: [],
      topLosers: []
    };
  }

  let totalValue = 0;
  let totalCost = 0;
  let annualDividendTotal = 0;

  const enrichedHoldings = holdings.map(h => {
    const shares = Number(h.shares) || 0;
    const costBasis = Number(h.costBasis) || 0;
    const currentPrice = Number(h.currentPrice) || costBasis;
    const value = shares * currentPrice;
    const cost = shares * costBasis;
    const gainLoss = value - cost;
    const gainLossPct = cost > 0 ? (gainLoss / cost) * 100 : 0;
    const yieldPct = Number(h.dividendYield) || 0;
    const annualDividend = (value * yieldPct) / 100;

    totalValue += value;
    totalCost += cost;
    annualDividendTotal += annualDividend;

    return {
      ...h,
      shares,
      costBasis,
      currentPrice,
      value: Number(value.toFixed(2)),
      cost: Number(cost.toFixed(2)),
      gainLoss: Number(gainLoss.toFixed(2)),
      gainLossPct: Number(gainLossPct.toFixed(2)),
      annualDividend: Number(annualDividend.toFixed(2))
    };
  });

  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const portfolioYieldPct = totalValue > 0 ? (annualDividendTotal / totalValue) * 100 : 0;

  // 1. Asset Class Allocation Breakdown & Actual vs Target
  const classMap = {};
  enrichedHoldings.forEach(h => {
    const c = h.assetClass || 'other';
    if (!classMap[c]) {
      classMap[c] = {
        classKey: c,
        label: ASSET_CLASS_LABELS[c] || c,
        color: ASSET_CLASS_COLORS[c] || '#64748b',
        value: 0,
        targetPct: 0,
        holdingsCount: 0
      };
    }
    classMap[c].value += h.value;
    classMap[c].targetPct += Number(h.targetAllocationPct) || 0;
    classMap[c].holdingsCount++;
  });

  const classBreakdown = Object.values(classMap).map(cls => {
    const actualPct = totalValue > 0 ? (cls.value / totalValue) * 100 : 0;
    const diffPct = actualPct - cls.targetPct;
    const targetValue = (totalValue * cls.targetPct) / 100;
    const dollarAdjustment = targetValue - cls.value; // positive = buy, negative = trim

    return {
      ...cls,
      value: Number(cls.value.toFixed(2)),
      actualPct: Number(actualPct.toFixed(1)),
      targetPct: Number(cls.targetPct.toFixed(1)),
      diffPct: Number(diffPct.toFixed(1)),
      dollarAdjustment: Number(dollarAdjustment.toFixed(2)),
      rebalanceAction: dollarAdjustment > 15 ? 'BUY' : dollarAdjustment < -15 ? 'TRIM' : 'BALANCED'
    };
  });

  // 2. Individual Rebalancing Recommendations
  const rebalancingList = enrichedHoldings.map(h => {
    const actualPct = totalValue > 0 ? (h.value / totalValue) * 100 : 0;
    const targetPct = Number(h.targetAllocationPct) || actualPct;
    const targetValue = (totalValue * targetPct) / 100;
    const dollarAdjustment = targetValue - h.value;
    const shareAdjustment = h.currentPrice > 0 ? dollarAdjustment / h.currentPrice : 0;

    return {
      id: h.id,
      symbol: h.symbol,
      name: h.name,
      currentValue: h.value,
      actualPct: Number(actualPct.toFixed(1)),
      targetPct: Number(targetPct.toFixed(1)),
      dollarAdjustment: Math.round(dollarAdjustment),
      shareAdjustment: Number(shareAdjustment.toFixed(2)),
      action: dollarAdjustment > 20 ? 'BUY' : dollarAdjustment < -20 ? 'TRIM' : 'HOLD'
    };
  }).sort((a, b) => Math.abs(b.dollarAdjustment) - Math.abs(a.dollarAdjustment));

  // 3. 12-Month Projected Dividend Schedule
  // Month index 0 = Jan, 11 = Dec
  const monthlyDividendProjection = Array(12).fill(0);
  enrichedHoldings.forEach(h => {
    if (h.annualDividend <= 0) return;

    if (h.dividendFrequency === 'monthly') {
      const perMonth = h.annualDividend / 12;
      for (let i = 0; i < 12; i++) {
        monthlyDividendProjection[i] += perMonth;
      }
    } else if (h.dividendFrequency === 'quarterly') {
      // Standard quarterly distributions: Mar (2), Jun (5), Sep (8), Dec (11)
      const perQuarter = h.annualDividend / 4;
      [2, 5, 8, 11].forEach(m => {
        monthlyDividendProjection[m] += perQuarter;
      });
    } else if (h.dividendFrequency === 'annual') {
      // Single annual payout in December
      monthlyDividendProjection[11] += h.annualDividend;
    }
  });

  // 4. Top Gainers & Losers
  const sortedByPct = [...enrichedHoldings].sort((a, b) => b.gainLossPct - a.gainLossPct);
  const topGainers = sortedByPct.filter(h => h.gainLossPct >= 0).slice(0, 3);
  const topLosers = [...sortedByPct].reverse().filter(h => h.gainLossPct < 0).slice(0, 3);

  return {
    totalValue: Number(totalValue.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    totalGainLoss: Number(totalGainLoss.toFixed(2)),
    totalGainLossPct: Number(totalGainLossPct.toFixed(2)),
    annualDividendTotal: Number(annualDividendTotal.toFixed(2)),
    portfolioYieldPct: Number(portfolioYieldPct.toFixed(2)),
    holdingsCount: enrichedHoldings.length,
    holdings: enrichedHoldings,
    classBreakdown,
    rebalancingList,
    monthlyDividendProjection: monthlyDividendProjection.map(v => Number(v.toFixed(2))),
    topGainers,
    topLosers
  };
}
