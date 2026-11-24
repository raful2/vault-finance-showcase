/**
 * Debt Payoff Simulator: Snowball vs Avalanche Methodology
 */

export function calculateDebtPayoff(debts, extraMonthlyBudget = 200) {
  if (!debts || debts.length === 0) {
    return {
      snowball: { totalInterest: 0, monthsToFreedom: 0, timeline: [] },
      avalanche: { totalInterest: 0, monthsToFreedom: 0, timeline: [] },
      interestSavedByAvalanche: 0,
      totalPrincipal: 0
    };
  }

  const totalPrincipal = debts.reduce((sum, d) => sum + (Number(d.balance) || 0), 0);

  function simulateStrategy(strategyType) {
    // Clone debts
    let currentDebts = debts.map(d => ({
      ...d,
      balance: Number(d.balance) || 0,
      rate: (Number(d.interestRate) || 0) / 100 / 12, // monthly rate
      minPayment: Number(d.minimumPayment) || 0
    }));

    // Sort order:
    // Snowball: lowest balance first
    // Avalanche: highest interest rate first
    if (strategyType === 'snowball') {
      currentDebts.sort((a, b) => a.balance - b.balance);
    } else {
      currentDebts.sort((a, b) => (b.rate * 12) - (a.rate * 12));
    }

    let totalInterestPaid = 0;
    let month = 0;
    const maxMonths = 360; // 30-year cap to prevent infinite loops
    const timeline = [];

    while (currentDebts.some(d => d.balance > 0.01) && month < maxMonths) {
      month++;
      let extraAvailable = Number(extraMonthlyBudget) || 0;
      let monthInterest = 0;
      let totalRemainingBalance = 0;

      // 1. Accrue monthly interest on each active debt
      currentDebts.forEach(d => {
        if (d.balance > 0.01) {
          const interest = d.balance * d.rate;
          d.balance += interest;
          monthInterest += interest;
          totalInterestPaid += interest;
        }
      });

      // 2. Pay minimum payments
      currentDebts.forEach(d => {
        if (d.balance > 0.01) {
          const payment = Math.min(d.balance, d.minPayment);
          d.balance -= payment;
        }
      });

      // 3. Roll freed-up payments + extra money onto the primary target debt
      for (const d of currentDebts) {
        if (d.balance > 0.01 && extraAvailable > 0) {
          const extraApplied = Math.min(d.balance, extraAvailable);
          d.balance -= extraApplied;
          extraAvailable -= extraApplied;
          if (extraAvailable <= 0) break;
        }
      }

      totalRemainingBalance = currentDebts.reduce((sum, d) => sum + Math.max(0, d.balance), 0);

      // Record monthly milestone
      if (month <= 60 || month % 6 === 0 || totalRemainingBalance <= 0) {
        timeline.push({
          month,
          remainingBalance: Math.round(totalRemainingBalance),
          cumulativeInterest: Math.round(totalInterestPaid)
        });
      }

      if (totalRemainingBalance <= 0.01) break;
    }

    return {
      totalInterest: Math.round(totalInterestPaid),
      monthsToFreedom: month,
      timeline
    };
  }

  const snowball = simulateStrategy('snowball');
  const avalanche = simulateStrategy('avalanche');
  const interestSaved = Math.max(0, snowball.totalInterest - avalanche.totalInterest);

  return {
    totalPrincipal: Math.round(totalPrincipal),
    snowball,
    avalanche,
    interestSavedByAvalanche: interestSaved
  };
}
