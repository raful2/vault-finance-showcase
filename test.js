import { calculateDebtPayoff } from './src/utils/debtCalculator.js';
import { parseCSV, processImportedRows } from './src/utils/csvParser.js';
import { analyzeFinances } from './src/utils/insightsEngine.js';
import { DEFAULT_STATE } from './src/mockData.js';

const res = calculateDebtPayoff(DEFAULT_STATE.debts, 200);
console.log('Debt Payoff Test:', JSON.stringify({ avalancheInterest: res.avalanche.totalInterest, snowballInterest: res.snowball.totalInterest, saved: res.interestSavedByAvalanche }));

const sampleCSV = 'Date,Payee,Amount\n2026-11-20,Starbucks Coffee,-6.50\n2026-11-21,Whole Foods Market,-85.20\n2026-11-22,Salary Deposit,2500';
const parsed = parseCSV(sampleCSV);
const processed = processImportedRows(parsed, parsed.detectedMapping);
console.log('CSV Import Test:', JSON.stringify({ count: processed.length, item0: processed[0].category }));

const analysis = analyzeFinances(DEFAULT_STATE);
console.log('Insights Engine Test:', JSON.stringify({ netWorth: analysis.netWorth, healthScore: analysis.healthScore, runwayMonths: analysis.runwayMonths, insightsCount: analysis.insights.length }));
