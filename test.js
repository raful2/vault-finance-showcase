import { calculateDebtPayoff } from './src/utils/debtCalculator.js';
import { parseCSV, processImportedRows } from './src/utils/csvParser.js';
import { analyzeFinances } from './src/utils/insightsEngine.js';
import { analyzePortfolio } from './src/utils/investmentCalculator.js';
import { hashPassword, getInitials } from './src/utils/authUtils.js';
import { DEFAULT_STATE } from './src/mockData.js';

// 1. Debt Test
const debtRes = calculateDebtPayoff(DEFAULT_STATE.debts, 200);
console.log('Debt Payoff Test:', JSON.stringify({
  avalancheInterest: debtRes.avalanche.totalInterest,
  snowballInterest: debtRes.snowball.totalInterest,
  saved: debtRes.interestSavedByAvalanche
}));

// 2. CSV Parser Test
const sampleCSV = 'Date,Payee,Amount\n2026-11-20,Starbucks Coffee,-6.50\n2026-11-21,Whole Foods Market,-85.20\n2026-11-22,Salary Deposit,2500';
const parsed = parseCSV(sampleCSV);
const processed = processImportedRows(parsed, parsed.detectedMapping);
console.log('CSV Import Test:', JSON.stringify({ count: processed.length, item0: processed[0].category }));

// 3. Insights Test
const analysis = analyzeFinances(DEFAULT_STATE);
console.log('Insights Engine Test:', JSON.stringify({
  netWorth: analysis.netWorth,
  healthScore: analysis.healthScore,
  runwayMonths: analysis.runwayMonths
}));

// 4. Portfolio & Investments Engine Test
const portfolio = analyzePortfolio(DEFAULT_STATE.investments);
console.log('Portfolio Analysis Test:', JSON.stringify({
  totalValue: portfolio.totalValue,
  totalGainLoss: portfolio.totalGainLoss,
  totalGainLossPct: portfolio.totalGainLossPct,
  annualDividendTotal: portfolio.annualDividendTotal,
  yieldPct: portfolio.portfolioYieldPct,
  rebalanceCount: portfolio.rebalancingList.length,
  classesCount: portfolio.classBreakdown.length,
  firstRebalance: portfolio.rebalancingList[0]?.symbol + ' ' + portfolio.rebalancingList[0]?.action
}));

// 5. Auth Utilities Test
async function testAuth() {
  const hash1 = await hashPassword('secret123');
  const hash2 = await hashPassword('secret123');
  const hash3 = await hashPassword('different');
  const initials = getInitials('Rafael Schwartz');
  console.log('Auth Utilities Test:', JSON.stringify({
    deterministic: hash1 === hash2,
    different: hash1 !== hash3,
    initials
  }));
}
testAuth();
