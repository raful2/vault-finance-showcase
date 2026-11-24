/**
 * Dashboard Overview & Net Worth View
 */

import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters.js';
import { analyzeFinances } from '../../utils/insightsEngine.js';

let chartInstanceCashflow = null;
let chartInstanceSpending = null;

export function renderOverview(container, state, store, navigateTo) {
  const analysis = analyzeFinances(state);
  const currency = state.settings.primaryCurrency || 'USD';
  const isPrivacy = state.settings.privacyBlur;

  container.innerHTML = `
    <!-- Top Hero: Net Worth & Financial Health Bar -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Net Worth Card -->
      <div class="lg:col-span-2 glass-card p-6 rounded-2xl relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 shadow-xl">
        <div class="absolute -right-10 -bottom-10 w-60 h-60 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <i data-lucide="wallet" class="w-5 h-5"></i>
            </span>
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Net Worth</span>
          </div>
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
            +5.2% this month
          </span>
        </div>

        <div class="space-y-1 mb-6">
          <div class="text-3xl sm:text-4xl font-extrabold tracking-tight text-white privacy-value">
            ${formatCurrency(analysis.netWorth, currency, isPrivacy)}
          </div>
          <p class="text-xs text-slate-400">Calculated across ${state.accounts.length} linked accounts & assets</p>
        </div>

        <!-- Breakdown Chips -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800/80">
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <div class="text-[11px] font-medium text-slate-400 mb-0.5">Total Assets</div>
            <div class="text-base font-bold text-emerald-400 privacy-value">
              ${formatCurrency(analysis.totalAssets, currency, isPrivacy)}
            </div>
          </div>
          <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <div class="text-[11px] font-medium text-slate-400 mb-0.5">Total Liabilities</div>
            <div class="text-base font-bold text-rose-400 privacy-value">
              ${formatCurrency(analysis.totalLiabilities, currency, isPrivacy)}
            </div>
          </div>
          <div class="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-800/40 border border-slate-800">
            <div class="text-[11px] font-medium text-slate-400 mb-0.5">Expense Runway</div>
            <div class="text-base font-bold text-sky-400">
              ${analysis.runwayMonths} months
            </div>
          </div>
        </div>
      </div>

      <!-- Financial Health Score Widget -->
      <div class="glass-card p-6 rounded-2xl bg-surface-900 border border-slate-800 shadow-xl flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-2">
              <span class="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <i data-lucide="award" class="w-5 h-5"></i>
              </span>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Health Index</span>
            </div>
            <span class="text-xs px-2.5 py-0.5 rounded-full font-bold ${
              analysis.healthScore >= 80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'
            }">
              ${analysis.healthScore >= 80 ? 'Excellent' : 'Good'}
            </span>
          </div>

          <div class="flex items-baseline gap-2 mb-3">
            <span class="text-4xl font-extrabold text-white">${analysis.healthScore}</span>
            <span class="text-sm font-medium text-slate-400">/ 100</span>
          </div>

          <!-- Progress Bar -->
          <div class="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden mb-4">
            <div class="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-500" style="width: ${analysis.healthScore}%"></div>
          </div>

          <div class="text-xs text-slate-400 space-y-2">
            <div class="flex justify-between">
              <span>Savings Rate:</span>
              <span class="font-semibold text-slate-200">${formatPercent(analysis.savingsRate)}</span>
            </div>
            <div class="flex justify-between">
              <span>50/30/20 Balance:</span>
              <span class="font-semibold text-slate-200">${analysis.macroRatio.needs}% / ${analysis.macroRatio.wants}% / ${analysis.macroRatio.savings}%</span>
            </div>
          </div>
        </div>

        <button id="btn-view-insights" class="mt-4 w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center gap-2 transition">
          <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
          <span>View Detailed AI Insights</span>
        </button>
      </div>
    </div>

    <!-- 4 Key Metric Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="glass-card p-4 rounded-xl border border-slate-800/80">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Monthly Income</span>
          <i data-lucide="arrow-down-left" class="w-4 h-4 text-emerald-400"></i>
        </div>
        <div class="text-xl font-bold text-white privacy-value">${formatCurrency(analysis.totalIncome, currency, isPrivacy)}</div>
        <div class="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
          <span>Active & side hustle</span>
        </div>
      </div>

      <div class="glass-card p-4 rounded-xl border border-slate-800/80">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Monthly Expenses</span>
          <i data-lucide="arrow-up-right" class="w-4 h-4 text-rose-400"></i>
        </div>
        <div class="text-xl font-bold text-white privacy-value">${formatCurrency(analysis.totalExpenses, currency, isPrivacy)}</div>
        <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <span>Outflows this cycle</span>
        </div>
      </div>

      <div class="glass-card p-4 rounded-xl border border-slate-800/80">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Net Cash Flow</span>
          <i data-lucide="piggy-bank" class="w-4 h-4 text-sky-400"></i>
        </div>
        <div class="text-xl font-bold text-white privacy-value">${formatCurrency(analysis.netSavings, currency, isPrivacy)}</div>
        <div class="text-[11px] text-sky-400 mt-1">
          <span>Retained capital</span>
        </div>
      </div>

      <div class="glass-card p-4 rounded-xl border border-slate-800/80">
        <div class="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span>Active Debts</span>
          <i data-lucide="zap" class="w-4 h-4 text-amber-400"></i>
        </div>
        <div class="text-xl font-bold text-white privacy-value">${formatCurrency(state.debts.reduce((s,d)=>s+d.balance, 0), currency, isPrivacy)}</div>
        <div class="text-[11px] text-amber-400 mt-1">
          <span>${state.debts.length} open debt balances</span>
        </div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Cash Flow / Net Worth Growth -->
      <div class="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="font-bold text-slate-100 text-sm sm:text-base">Net Worth & Cash Flow Trajectory</h3>
            <p class="text-xs text-slate-400">Past 6 months trend with current month projection</p>
          </div>
          <span class="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium">Monthly</span>
        </div>
        <div class="h-64 relative">
          <canvas id="canvas-cashflow-chart"></canvas>
        </div>
      </div>

      <!-- Spending Breakdown Donut -->
      <div class="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-slate-100 text-sm sm:text-base">Spending Breakdown</h3>
          <span class="text-xs text-slate-400">Top Categories</span>
        </div>
        <div class="h-56 relative flex items-center justify-center">
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
          <h3 class="font-bold text-slate-100 text-sm sm:text-base">Your Accounts</h3>
          <span class="text-xs text-slate-400">${state.accounts.length} active</span>
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
                    <span>${formatDate(tx.date)}</span>
                    <span>•</span>
                    <span class="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 text-[10px]">${tx.category}</span>
                  </div>
                </div>
              </div>
              <div class="text-xs font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-200'} privacy-value">
                ${tx.amount > 0 ? '+' : ''}${formatCurrency(tx.amount, tx.currency || currency, isPrivacy)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  // Attach Navigation Clickers
  const insightsBtn = container.querySelector('#btn-view-insights');
  if (insightsBtn) {
    insightsBtn.addEventListener('click', () => navigateTo('insights'));
  }

  const viewAllTxBtn = container.querySelector('#btn-view-all-tx');
  if (viewAllTxBtn) {
    viewAllTxBtn.addEventListener('click', () => navigateTo('transactions'));
  }

  container.querySelectorAll('[data-account-type="investment"]').forEach(el => {
    el.addEventListener('click', () => navigateTo('investments'));
  });

  // Render Charts with Chart.js
  setTimeout(() => {
    initOverviewCharts(state, isPrivacy, currency);
    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }
  }, 50);
}

function initOverviewCharts(state, isPrivacy, currency) {
  if (typeof Chart === 'undefined') return;

  // 1. Net Worth Trajectory Area Chart
  const ctxCashflow = document.getElementById('canvas-cashflow-chart');
  if (ctxCashflow) {
    if (chartInstanceCashflow) chartInstanceCashflow.destroy();

    const labels = ['Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov (Current)'];
    const netWorthData = [48200, 50100, 52400, 53900, 55200, 56696];

    chartInstanceCashflow = new Chart(ctxCashflow, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Net Worth',
          data: netWorthData,
          borderColor: '#0284c7',
          backgroundColor: 'rgba(2, 132, 199, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2.5,
          pointBackgroundColor: '#0284c7',
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
            callbacks: {
              label: (ctx) => isPrivacy ? '••••••' : `$${ctx.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 11 },
              callback: (val) => isPrivacy ? '••' : `$${(val / 1000)}k`
            }
          }
        }
      }
    });
  }

  // 2. Spending Donut Chart
  const ctxSpending = document.getElementById('canvas-spending-donut');
  if (ctxSpending) {
    if (chartInstanceSpending) chartInstanceSpending.destroy();

    chartInstanceSpending = new Chart(ctxSpending, {
      type: 'doughnut',
      data: {
        labels: ['Housing & Rent', 'Groceries', 'Dining & Social', 'Utilities', 'Subscriptions', 'Other'],
        datasets: [{
          data: [1650, 241, 100, 115, 33, 140],
          backgroundColor: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#06b6d4',
            '#8b5cf6',
            '#64748b'
          ],
          borderWidth: 2,
          borderColor: '#0f172a'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => isPrivacy ? '••••••' : ` ${ctx.label}: $${ctx.parsed.toLocaleString()}`
            }
          }
        }
      }
    });
  }
}
