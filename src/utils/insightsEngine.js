/**
 * Smart Financial Insights & Pattern Analyzer Engine
 */

export function analyzeFinances(state) {
  const { transactions = [], budgets = [], accounts = [], goals = [], debts = [] } = state;

  // Filter current month transactions
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let totalIncome = 0;
  let totalExpenses = 0;
  let needsSpending = 0;
  let wantsSpending = 0;
  let savingsAllocated = 0;
  const categoryTotals = {};

  transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    const amount = Number(tx.amount) || 0;

    if (amount > 0) {
      totalIncome += amount;
    } else {
      const expense = Math.abs(amount);
      totalExpenses += expense;

      // Category breakdown
      categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + expense;

      // Macro breakdown
      if (tx.macroBucket === 'needs') {
        needsSpending += expense;
      } else if (tx.macroBucket === 'wants') {
        wantsSpending += expense;
      } else if (tx.macroBucket === 'savings') {
        savingsAllocated += expense;
      } else {
        wantsSpending += expense;
      }
    }
  });

  // Net Cash Flow
  const netSavings = Math.max(0, totalIncome - totalExpenses);
  const savingsRate = totalIncome > 0 ? ((netSavings + savingsAllocated) / totalIncome) * 100 : 0;

  // Actual 50/30/20 proportions
  const totalOutflow = needsSpending + wantsSpending + savingsAllocated || 1;
  const needsRatio = Math.round((needsSpending / totalOutflow) * 100);
  const wantsRatio = Math.round((wantsSpending / totalOutflow) * 100);
  const savingsRatio = Math.round(((savingsAllocated + netSavings) / totalOutflow) * 100);

  // Total Assets vs Liabilities for Net Worth
  let totalAssets = 0;
  let totalLiabilities = 0;

  accounts.forEach(acc => {
    const bal = Number(acc.balance) || 0;
    if (bal >= 0) {
      totalAssets += bal;
    } else {
      totalLiabilities += Math.abs(bal);
    }
  });

  const netWorth = totalAssets - totalLiabilities;

  // Financial Health Score (0-100)
  // Factors:
  // 1. Savings Rate (target >= 20% -> up to 35 pts)
  // 2. Needs ratio (target <= 50% -> up to 25 pts)
  // 3. Wants ratio (target <= 30% -> up to 20 pts)
  // 4. Emergency reserve (> 3 months expenses -> up to 20 pts)
  let healthScore = 0;

  // Savings score
  healthScore += Math.min(35, Math.round((savingsRate / 20) * 35));

  // Needs score
  if (needsRatio <= 50) {
    healthScore += 25;
  } else if (needsRatio <= 65) {
    healthScore += 15;
  } else {
    healthScore += 5;
  }

  // Wants score
  if (wantsRatio <= 30) {
    healthScore += 20;
  } else if (wantsRatio <= 45) {
    healthScore += 10;
  } else {
    healthScore += 5;
  }

  // Emergency coverage
  const monthlyBurn = totalExpenses > 0 ? totalExpenses : 2500;
  const liquidCash = accounts.filter(a => a.type === 'checking' || a.type === 'savings' || a.type === 'cash')
    .reduce((s, a) => s + Math.max(0, a.balance), 0);
  const runwayMonths = (liquidCash / monthlyBurn).toFixed(1);

  if (runwayMonths >= 6) {
    healthScore += 20;
  } else if (runwayMonths >= 3) {
    healthScore += 14;
  } else if (runwayMonths >= 1) {
    healthScore += 8;
  } else {
    healthScore += 2;
  }

  healthScore = Math.max(10, Math.min(100, healthScore));

  // Generate Smart Actionable Insights
  const insights = [];

  // 1. Health Score insight
  if (healthScore >= 80) {
    insights.push({
      type: 'success',
      icon: 'sparkles',
      title: 'Excellent Financial Health',
      description: `Your financial health score is ${healthScore}/100 with an impressive ${savingsRate.toFixed(1)}% savings rate. Keep compounding!`
    });
  } else if (healthScore >= 60) {
    insights.push({
      type: 'info',
      icon: 'trending-up',
      title: 'Strong Financial Foundation',
      description: `Score of ${healthScore}/100. Trimming 5-10% from flexible discretionary categories will push you into the top tier.`
    });
  } else {
    insights.push({
      type: 'warning',
      icon: 'alert-triangle',
      title: 'Budget Tuning Recommended',
      description: `Current health score is ${healthScore}/100. Your essential needs consume ${needsRatio}% of outflows. Look into recurring bill reductions.`
    });
  }

  // 2. Emergency Runway insight
  if (runwayMonths >= 3) {
    insights.push({
      type: 'success',
      icon: 'shield-check',
      title: 'Emergency Cushion Verified',
      description: `You have ${runwayMonths} months of liquid expense runway ($${Math.round(liquidCash).toLocaleString()}) safely banked.`
    });
  } else {
    insights.push({
      type: 'warning',
      icon: 'shield-alert',
      title: 'Expand Emergency Safety Net',
      description: `You currently have ${runwayMonths} months of runway. Standard financial planning suggests aiming for 3 to 6 months.`
    });
  }

  // 3. Category budget variances
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
  if (sortedCategories.length > 0) {
    const [topCat, topAmount] = sortedCategories[0];
    const relatedBudget = budgets.find(b => b.category.toLowerCase() === topCat.toLowerCase());
    if (relatedBudget && topAmount > relatedBudget.monthlyLimit) {
      insights.push({
        type: 'danger',
        icon: 'trending-down',
        title: `Over-Budget Alert: ${topCat}`,
        description: `You spent $${Math.round(topAmount)} in ${topCat}, exceeding the $${relatedBudget.monthlyLimit} limit by $${Math.round(topAmount - relatedBudget.monthlyLimit)}.`
      });
    } else {
      insights.push({
        type: 'info',
        icon: 'pie-chart',
        title: `Top Spending Category: ${topCat}`,
        description: `${topCat} accounts for $${Math.round(topAmount)} (${Math.round((topAmount / totalExpenses) * 100)}% of total monthly expenses).`
      });
    }
  }

  // 4. Debt Payoff Tip
  if (debts.length > 0) {
    const highestAprDebt = [...debts].sort((a, b) => b.interestRate - a.interestRate)[0];
    if (highestAprDebt && highestAprDebt.balance > 0) {
      insights.push({
        type: 'tip',
        icon: 'zap',
        title: `Avalanche Interest Opportunity`,
        description: `Targeting an extra $50/mo towards "${highestAprDebt.name}" (${highestAprDebt.interestRate}% APR) will eliminate compounding interest fastest.`
      });
    }
  }

  return {
    totalIncome,
    totalExpenses,
    netSavings,
    savingsRate,
    macroRatio: {
      needs: needsRatio,
      wants: wantsRatio,
      savings: savingsRatio
    },
    totalAssets,
    totalLiabilities,
    netWorth,
    healthScore,
    runwayMonths,
    categoryTotals,
    insights
  };
}
