/**
 * Debt Payoff Simulator: Snowball vs Avalanche Methodology
 */

import { calculateDebtPayoff } from '../../utils/debtCalculator.js';
import { formatCurrency } from '../../utils/formatters.js';

let debtChartInstance = null;

export function renderDebt(container, state, store) {
  const currency = state.settings.primaryCurrency || 'USD';
  const isPrivacy = state.settings.privacyBlur;

  let extraMonthlyPayment = 200;

  function render() {
    const payoff = calculateDebtPayoff(state.debts, extraMonthlyPayment);

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <i data-lucide="zap" class="w-4 h-4"></i>
              </span>
              <h3 class="font-bold text-slate-100 text-base">Debt Elimination Simulator</h3>
            </div>
            <p class="text-xs text-slate-400">Compare Snowball (quick psychological wins) vs. Avalanche (mathematically lowest interest)</p>
          </div>

          <!-- Extra Payment Slider -->
          <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800 w-full md:w-80">
            <div class="flex justify-between items-center text-xs mb-1.5">
              <span class="text-slate-400">Extra Monthly Budget:</span>
              <span class="font-bold text-sky-400 text-sm privacy-value">+${formatCurrency(extraMonthlyPayment, currency, isPrivacy)}/mo</span>
            </div>
            <input type="range" id="slider-extra-payment" min="0" max="1000" step="25" value="${extraMonthlyPayment}"
              class="w-full accent-sky-500 cursor-pointer">
          </div>
        </div>

        <!-- Strategy Comparison Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Avalanche Strategy (Recommended by Math) -->
          <div class="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-surface-900 to-surface-900 border border-indigo-500/30 space-y-4 shadow-xl relative overflow-hidden">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <span class="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-bold">
                  <i data-lucide="shield-check" class="w-5 h-5"></i>
                </span>
                <div>
                  <h4 class="font-bold text-white text-base">Avalanche Strategy</h4>
                  <span class="text-[11px] text-indigo-300">Highest APR interest first</span>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Saves ${formatCurrency(payoff.interestSavedByAvalanche, currency, isPrivacy)}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2">
              <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span class="text-[11px] text-slate-400">Total Interest Paid:</span>
                <div class="text-lg font-extrabold text-emerald-400 privacy-value">
                  ${formatCurrency(payoff.avalanche.totalInterest, currency, isPrivacy)}
                </div>
              </div>
              <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span class="text-[11px] text-slate-400">Debt-Free In:</span>
                <div class="text-lg font-extrabold text-white">
                  ${payoff.avalanche.monthsToFreedom} months
                </div>
              </div>
            </div>

            <p class="text-xs text-slate-400 leading-relaxed">
              Attacks the debt charging the highest interest percentage first. Saves the most money in the long run.
            </p>
          </div>

          <!-- Snowball Strategy -->
          <div class="p-6 rounded-2xl bg-surface-900 border border-slate-800 space-y-4 shadow-xl">
            <div class="flex justify-between items-center">
              <div class="flex items-center gap-2">
                <span class="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 font-bold">
                  <i data-lucide="sparkles" class="w-5 h-5"></i>
                </span>
                <div>
                  <h4 class="font-bold text-slate-200 text-base">Snowball Strategy</h4>
                  <span class="text-[11px] text-slate-400">Lowest balance first</span>
                </div>
              </div>
              <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                Motivation Focus
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3 pt-2">
              <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span class="text-[11px] text-slate-400">Total Interest Paid:</span>
                <div class="text-lg font-extrabold text-slate-200 privacy-value">
                  ${formatCurrency(payoff.snowball.totalInterest, currency, isPrivacy)}
                </div>
              </div>
              <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span class="text-[11px] text-slate-400">Debt-Free In:</span>
                <div class="text-lg font-extrabold text-white">
                  ${payoff.snowball.monthsToFreedom} months
                </div>
              </div>
            </div>

            <p class="text-xs text-slate-400 leading-relaxed">
              Knocks out small balances first to give fast psychological wins, rolling payments over to the next account.
            </p>
          </div>

        </div>

        <!-- Debt Amortization Trajectory Chart -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800">
          <h4 class="font-bold text-slate-100 text-sm mb-4">Payoff Balance Trajectory Over Time</h4>
          <div class="h-64 relative">
            <canvas id="canvas-debt-chart"></canvas>
          </div>
        </div>

        <!-- Current Debts List -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex justify-between items-center">
            <h4 class="font-bold text-slate-100 text-sm">Active Debt Accounts (${state.debts.length})</h4>
            <span class="text-xs text-slate-400 font-semibold">Total: <strong class="text-rose-400 privacy-value">${formatCurrency(payoff.totalPrincipal, currency, isPrivacy)}</strong></span>
          </div>

          <div class="divide-y divide-slate-800">
            ${state.debts.map(d => `
              <div class="py-3 flex items-center justify-between">
                <div>
                  <h5 class="font-bold text-slate-200 text-xs">${d.name}</h5>
                  <div class="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span class="text-amber-400 font-semibold">${d.interestRate}% APR</span>
                    <span>•</span>
                    <span>Min Payment: ${formatCurrency(d.minimumPayment, currency, isPrivacy)}/mo</span>
                  </div>
                </div>
                <div class="text-right">
                  <div class="font-bold text-sm text-slate-100 privacy-value">${formatCurrency(d.balance, currency, isPrivacy)}</div>
                  <button data-delete-debt="${d.id}" class="text-[10px] text-slate-500 hover:text-rose-400 transition">Remove</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    // Attach listeners
    const slider = container.querySelector('#slider-extra-payment');
    if (slider) {
      slider.addEventListener('input', (e) => {
        extraMonthlyPayment = parseInt(e.target.value);
        render();
      });
    }

    container.querySelectorAll('button[data-delete-debt]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-debt');
        if (confirm('Delete this debt entry?')) {
          store.deleteDebt(id);
          render();
        }
      });
    });

    setTimeout(() => {
      initDebtChart(payoff, isPrivacy);
      if (window.lucide) {
        window.lucide.createIcons({ root: container });
      }
    }, 50);
  }

  function initDebtChart(payoff, isPrivacy) {
    if (typeof Chart === 'undefined') return;
    const ctx = document.getElementById('canvas-debt-chart');
    if (!ctx) return;

    if (debtChartInstance) debtChartInstance.destroy();

    const timeline = payoff.avalanche.timeline || [];
    const labels = timeline.map(t => `Month ${t.month}`);
    const balances = timeline.map(t => t.remainingBalance);

    debtChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Remaining Balance',
          data: balances,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => isPrivacy ? '••••••' : `$${c.parsed.y.toLocaleString()}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 10 },
              callback: (v) => isPrivacy ? '••' : `$${(v / 1000)}k`
            }
          }
        }
      }
    });
  }

  render();
}
