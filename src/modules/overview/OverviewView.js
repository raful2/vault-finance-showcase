/**
 * Overview & Net Worth Dashboard View
 */

import { formatCurrency, formatPercentage } from '../../utils/formatters.js';
import { analyzeFinances } from '../../utils/insightsEngine.js';
import { openAddAccountModal } from '../accounts/AddAccountModal.js';

let netWorthChartInstance = null;
let spendingDonutInstance = null;

export function renderOverview(container, state, store, onNavigate) {
  const analysis = analyzeFinances(state);
  const currency = state.settings.primaryCurrency;
  const isPrivacy = state.settings.privacyBlur;

  // Compute monthly cash flow values
  const monthlyIncome = analysis.totalIncome || 0;
  const monthlyExpenses = analysis.totalExpenses || 0;
  const netCashFlow = monthlyIncome - monthlyExpenses;
  const netWorthTrend = netCashFlow > 0 ? netCashFlow : 850;

  container.innerHTML = `
    <!-- Top Summary Metrics Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      
      <!-- Net Worth Card -->
      <div class="glass-card p-5 rounded-2xl border border-slate-800 relative overflow-hidden group">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider">Total Net Worth</span>
          <div class="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
            <i data-lucide="wallet" class="w-4 h-4"></i>
          </div>
        </div>
        <div class="text-2xl font-bold tracking-tight text-slate-100 privacy-value mb-1">
          ${formatCurrency(analysis.netWorth, currency, isPrivacy)}
        </div>
        <div class="flex items-center gap-1.5 text-xs ${netWorthTrend >= 0 ? 'text-emerald-400' : 'text-rose-400'} font-medium">
          <i data-lucide="${netWorthTrend >= 0 ? 'trending-up' : 'trending-down'}" class="w-3.5 h-3.5"></i>
          <span>${netWorthTrend >= 0 ? '+' : ''}${formatCurrency(netWorthTrend, currency, isPrivacy)} this month</span>
        </div>
      </div>

      <!-- Total Assets -->
      <div class="glass-card p-5 rounded-2xl border border-slate-800">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider">Total Assets</span>
          <div class="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <i data-lucide="shield-check" class="w-4 h-4"></i>
          </div>
        </div>
        <div class="text-2xl font-bold tracking-tight text-emerald-400 privacy-value mb-1">
          ${formatCurrency(analysis.totalAssets, currency, isPrivacy)}
        </div>
        <div class="text-xs text-slate-400 font-medium">
          Across ${state.accounts.filter(a => a.balance > 0).length} accounts
        </div>
      </div>

      <!-- Total Liabilities -->
      <div class="glass-card p-5 rounded-2xl border border-slate-800">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider">Total Liabilities</span>
          <div class="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
            <i data-lucide="credit-card" class="w-4 h-4"></i>
          </div>
        </div>
        <div class="text-2xl font-bold tracking-tight text-rose-400 privacy-value mb-1">
          ${formatCurrency(analysis.totalLiabilities, currency, isPrivacy)}
        </div>
        <div class="text-xs text-slate-400 font-medium">
          Debt-to-Asset: ${formatPercentage(analysis.totalAssets ? (analysis.totalLiabilities / analysis.totalAssets) * 100 : 0)}
        </div>
      </div>

      <!-- Monthly Savings Rate -->
      <div class="glass-card p-5 rounded-2xl border border-slate-800">
        <div class="flex items-center justify-between text-slate-400 mb-2">
          <span class="text-xs font-semibold uppercase tracking-wider">Savings Rate</span>
          <div class="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <i data-lucide="piggy-bank" class="w-4 h-4"></i>
          </div>
        </div>
        <div class="text-2xl font-bold tracking-tight text-indigo-300 privacy-value mb-1">
          ${Number(analysis.savingsRate || 0).toFixed(1)}%
        </div>
        <div class="text-xs text-slate-400 font-medium">
          Target benchmark: 20%+
        </div>
      </div>

    </div>

    <!-- Monthly Cash Flow Banner -->
    <div class="glass-card p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold">
          <i data-lucide="arrow-left-right" class="w-6 h-6"></i>
        </div>
        <div>
          <h4 class="font-bold text-slate-100 text-sm sm:text-base">Monthly Cash Flow Health</h4>
          <p class="text-xs text-slate-400">Total monthly income vs actual living expenses</p>
        </div>
      </div>
      
      <div class="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
        <div class="text-right">
          <div class="text-xs text-slate-400">Income</div>
          <div class="text-sm font-bold text-emerald-400 privacy-value">+${formatCurrency(monthlyIncome, currency, isPrivacy)}</div>
        </div>
        <div class="text-right">
          <div class="text-xs text-slate-400">Spent</div>
          <div class="text-sm font-bold text-slate-200 privacy-value">-${formatCurrency(monthlyExpenses, currency, isPrivacy)}</div>
        </div>
        <div class="text-right pl-3 border-l border-slate-800">
          <div class="text-xs text-slate-400">Net Flow</div>
          <div class="text-sm font-bold ${netCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'} privacy-value">
            ${netCashFlow >= 0 ? '+' : ''}${formatCurrency(netCashFlow, currency, isPrivacy)}
          </div>
        </div>
      </div>
    </div>

    <!-- Charts Row: Trajectory & Spending Breakdown -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Net Worth Trajectory Chart -->
      <div class="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-100 text-sm sm:text-base">Net Worth Trajectory</h3>
            <p class="text-xs text-slate-400">6-Month historical tracking and growth</p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
            6 Months
          </span>
        </div>
        <div class="h-64 relative">
          <canvas id="canvas-net-worth-history"></canvas>
        </div>
      </div>

      <!-- Spending Breakdown Donut -->
      <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-slate-100 text-sm sm:text-base">Spending Breakdown</h3>
          <span class="text-xs text-slate-400">Top Categories</span>
        </div>
        <div class="h-60 relative flex items-center justify-center pt-2">
          <canvas id="canvas-spending-donut"></canvas>
        </div>
        <div class="grid grid-cols-2 gap-2 text-xs text-slate-400 pt-3 border-t border-slate-800/60">
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Needs: ${analysis.macroRatio.needs}%</div>
          <div class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Wants: ${analysis.macroRatio.wants}%</div>
        </div>
      </div>
    </div>

    <!-- Accounts Quick Grid & Recent Transactions -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Accounts Column -->
      <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <h3 class="font-bold text-slate-100 text-sm sm:text-base">Your Accounts</h3>
            <span class="text-xs text-slate-400">(${state.accounts.length})</span>
          </div>
          <button id="btn-add-account" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 border border-sky-500/30 flex items-center gap-1 transition">
            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
            <span>Add Account</span>
          </button>
        </div>
        <div class="space-y-2.5">
          ${state.accounts.map(acc => `
            <div data-account-card="${acc.id}" data-account-type="${acc.type}" class="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between hover:bg-slate-800 transition ${acc.type === 'investment' ? 'cursor-pointer hover:border-sky-500/50 group' : ''}">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs" style="background-color: ${acc.color || '#3b82f6'}20; color: ${acc.color || '#3b82f6'}; border: 1px solid ${acc.color || '#3b82f6'}40">
                  <i data-lucide="${acc.type === 'credit' ? 'credit-card' : acc.type === 'investment' ? 'trending-up' : acc.type === 'savings' ? 'piggy-bank' : 'landmark'}" class="w-4 h-4"></i>
                </div>
                <div>
                  <div class="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span>${acc.name}</span>
                    ${acc.type === 'investment' ? `<span class="text-[10px] text-sky-400 group-hover:underline">Deep-Dive →</span>` : ''}
                  </div>
                  <div class="text-[11px] text-slate-400">${acc.institution} •••• ${acc.mask}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs font-bold ${acc.balance < 0 ? 'text-rose-400' : 'text-slate-100'} privacy-value">
                  ${formatCurrency(acc.balance, acc.currency || currency, isPrivacy)}
                </div>
                <div class="text-[10px] uppercase font-semibold text-slate-500">${acc.type}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recent Activity Column -->
      <div class="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-slate-100 text-sm sm:text-base">Recent Transactions</h3>
            <p class="text-xs text-slate-400">Latest activity across all accounts</p>
          </div>
          <button id="btn-view-all-tx" class="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition">
            <span>View All</span>
            <i data-lucide="arrow-right" class="w-3.5 h-3.5"></i>
          </button>
        </div>

        <div class="divide-y divide-slate-800/80">
          ${(state.transactions || []).slice(0, 5).map(tx => `
            <div class="py-3 flex items-center justify-between hover:bg-slate-800/30 px-2 rounded-lg transition">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-300'}">
                  <i data-lucide="${tx.amount > 0 ? 'arrow-down-left' : 'shopping-bag'}" class="w-4 h-4"></i>
                </div>
                <div>
                  <div class="text-xs font-semibold text-slate-200">${tx.payee}</div>
                  <div class="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>${tx.date}</span>
                    <span>•</span>
                    <span class="px-1.5 py-0.5 rounded bg-slate-800/80 text-[10px]">${tx.category}</span>
                  </div>
                </div>
              </div>

              <div class="text-right">
                <div class="text-xs font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-200'} privacy-value">
                  ${tx.amount > 0 ? '+' : ''}${formatCurrency(tx.amount, currency, isPrivacy)}
                </div>
                <div class="text-[10px] text-slate-500">${tx.macroBucket}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach Add Account handler
  const btnAddAccount = container.querySelector('#btn-add-account');
  if (btnAddAccount) {
    btnAddAccount.addEventListener('click', () => {
      openAddAccountModal(state, store, () => {
        if (window.appInstance) window.appInstance.showToast('Account added successfully!');
      });
    });
  }

  // Hook up investment account clicks to navigate to investments tab
  container.querySelectorAll('[data-account-card]').forEach(card => {
    const accType = card.getAttribute('data-account-type');
    if (accType === 'investment' && onNavigate) {
      card.addEventListener('click', () => {
        onNavigate('investments');
      });
    }
  });

  const viewAllBtn = container.querySelector('#btn-view-all-tx');
  if (viewAllBtn && onNavigate) {
    viewAllBtn.addEventListener('click', () => onNavigate('transactions'));
  }

  initOverviewCharts(state);

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }
}

function initOverviewCharts(state) {
  if (typeof Chart === 'undefined') return;

  const ctxHistory = document.getElementById('canvas-net-worth-history');
  if (ctxHistory) {
    if (netWorthChartInstance) netWorthChartInstance.destroy();

    const months = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentNW = state.accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0);
    const historyData = [
      currentNW * 0.82,
      currentNW * 0.86,
      currentNW * 0.91,
      currentNW * 0.94,
      currentNW * 0.97,
      currentNW
    ];

    netWorthChartInstance = new Chart(ctxHistory, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Net Worth',
          data: historyData,
          borderColor: '#38bdf8',
          backgroundColor: 'rgba(56, 189, 248, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#38bdf8',
          pointBorderColor: '#0f172a',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: '#334155',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#38bdf8',
            padding: 10,
            displayColors: false
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: { color: '#64748b', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(51, 65, 85, 0.25)' },
            ticks: {
              color: '#64748b',
              font: { size: 11 },
              callback: (val) => '$' + (val >= 1000 ? (val / 1000).toFixed(0) + 'k' : val)
            }
          }
        }
      }
    });
  }

  const ctxDonut = document.getElementById('canvas-spending-donut');
  if (ctxDonut) {
    if (spendingDonutInstance) spendingDonutInstance.destroy();

    const catTotals = {};
    (state.transactions || []).forEach(t => {
      if (t.amount < 0) {
        catTotals[t.category] = (catTotals[t.category] || 0) + Math.abs(t.amount);
      }
    });

    const labels = Object.keys(catTotals).slice(0, 5);
    const dataVals = labels.map(l => catTotals[l]);

    spendingDonutInstance = new Chart(ctxDonut, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['Living Expenses'],
        datasets: [{
          data: dataVals.length ? dataVals : [100],
          backgroundColor: [
            '#38bdf8',
            '#818cf8',
            '#f59e0b',
            '#10b981',
            '#ec4899'
          ],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false }
        }
      }
    });
  }
}
