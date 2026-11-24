/**
 * Modular Budgeting Hub
 * Features user-selectable views:
 * 1. Category Budgets (monthly limits, progress bars, overspend alerts)
 * 2. 50/30/20 Macro Health Breakdown
 * 3. Zero-Based Envelopes (allocate every dollar to zero)
 * 4. Cash Flow & Recurring Bills
 */

import { formatCurrency, formatPercent } from '../../utils/formatters.js';
import { analyzeFinances } from '../../utils/insightsEngine.js';

export function renderBudgets(container, state, store) {
  const currency = state.settings.primaryCurrency || 'USD';
  const isPrivacy = state.settings.privacyBlur;
  let activeSubView = state.settings.activeBudgetView || 'hybrid'; // 'hybrid', '503020', 'envelope', 'bills'

  function calculateSpendingByCategory() {
    const map = {};
    (state.transactions || []).forEach(tx => {
      const amount = Number(tx.amount) || 0;
      if (amount < 0) {
        const cat = tx.category;
        map[cat] = (map[cat] || 0) + Math.abs(amount);
      }
    });
    return map;
  }

  function render() {
    const analysis = analyzeFinances(state);
    const spendingMap = calculateSpendingByCategory();
    const totalBudgeted = state.budgets.reduce((s, b) => s + Number(b.monthlyLimit), 0);

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- View Mode Switcher Header -->
        <div class="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 class="font-bold text-slate-100 text-base">Budgeting & Cash Allocation Engine</h3>
            <p class="text-xs text-slate-400">Choose your preferred budgeting methodology or explore all four</p>
          </div>

          <!-- View Selector Buttons -->
          <div class="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs w-full md:w-auto overflow-x-auto">
            <button data-subview="hybrid" class="px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeSubView === 'hybrid' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }">
              Category Limits
            </button>
            <button data-subview="503020" class="px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeSubView === '503020' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }">
              50 / 30 / 20 Rule
            </button>
            <button data-subview="envelope" class="px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeSubView === 'envelope' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }">
              Zero-Based Envelopes
            </button>
            <button data-subview="bills" class="px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeSubView === 'bills' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }">
              Recurring Bills
            </button>
          </div>
        </div>

        <!-- SUBVIEW CONTENT -->
        <div id="subview-container"></div>

      </div>
    `;

    // Render active subview
    const subContainer = container.querySelector('#subview-container');
    if (activeSubView === 'hybrid') {
      renderCategoryBudgets(subContainer, state, store, analysis, spendingMap, currency, isPrivacy, totalBudgeted);
    } else if (activeSubView === '503020') {
      render503020View(subContainer, state, store, analysis, currency, isPrivacy);
    } else if (activeSubView === 'envelope') {
      renderEnvelopeView(subContainer, state, store, analysis, spendingMap, currency, isPrivacy);
    } else if (activeSubView === 'bills') {
      renderBillsView(subContainer, state, store, currency, isPrivacy);
    }

    // Attach switchers
    container.querySelectorAll('button[data-subview]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSubView = btn.getAttribute('data-subview');
        store.setBudgetView(activeSubView);
        render();
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }
  }

  // --- SUBVIEW 1: Category Budgets ---
  function renderCategoryBudgets(target, state, store, analysis, spendingMap, currency, isPrivacy, totalBudgeted) {
    target.innerHTML = `
      <div class="space-y-6">
        
        <!-- Summary Stats -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-card p-4 rounded-xl border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Total Monthly Budget</span>
            <div class="text-xl font-bold text-white mt-1 privacy-value">${formatCurrency(totalBudgeted, currency, isPrivacy)}</div>
          </div>
          <div class="glass-card p-4 rounded-xl border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Actual Spent So Far</span>
            <div class="text-xl font-bold text-sky-400 mt-1 privacy-value">${formatCurrency(analysis.totalExpenses, currency, isPrivacy)}</div>
          </div>
          <div class="glass-card p-4 rounded-xl border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Remaining Budget Pool</span>
            <div class="text-xl font-bold ${totalBudgeted - analysis.totalExpenses < 0 ? 'text-rose-400' : 'text-emerald-400'} mt-1 privacy-value">
              ${formatCurrency(totalBudgeted - analysis.totalExpenses, currency, isPrivacy)}
            </div>
          </div>
        </div>

        <!-- Budget Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${state.budgets.map(b => {
            const spent = spendingMap[b.category] || 0;
            const limit = Number(b.monthlyLimit) || 1;
            const pct = Math.min(150, Math.round((spent / limit) * 100));
            const isOver = spent > limit;
            const isNearing = pct >= 85 && !isOver;

            return `
              <div class="glass-card p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-slate-700 transition">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      b.macroBucket === 'needs' ? 'bg-blue-500/10 text-blue-400' :
                      b.macroBucket === 'wants' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                    }">
                      <i data-lucide="${b.macroBucket === 'needs' ? 'home' : b.macroBucket === 'wants' ? 'coffee' : 'shield'}" class="w-4 h-4"></i>
                    </div>
                    <div>
                      <h4 class="font-bold text-slate-100 text-sm">${b.category}</h4>
                      <span class="text-[10px] uppercase font-semibold text-slate-500">${b.macroBucket}</span>
                    </div>
                  </div>

                  ${isOver ? `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      Over by ${formatCurrency(spent - limit, currency, isPrivacy)}
                    </span>
                  ` : isNearing ? `
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      85% Consumed
                    </span>
                  ` : `
                    <span class="text-xs text-slate-400 font-medium">
                      ${formatCurrency(limit - spent, currency, isPrivacy)} left
                    </span>
                  `}
                </div>

                <!-- Progress Bar -->
                <div>
                  <div class="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-300 ${
                      isOver ? 'bg-rose-500' : isNearing ? 'bg-amber-500' : 'bg-sky-500'
                    }" style="width: ${Math.min(100, pct)}%"></div>
                  </div>
                  <div class="flex justify-between text-[11px] text-slate-400 mt-1.5 font-medium">
                    <span class="privacy-value">${formatCurrency(spent, currency, isPrivacy)} spent</span>
                    <span>${pct}% of ${formatCurrency(limit, currency, isPrivacy)}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }

  // --- SUBVIEW 2: 50/30/20 Rule ---
  function render503020View(target, state, store, analysis, currency, isPrivacy) {
    const { macroRatio, totalExpenses, totalIncome } = analysis;

    target.innerHTML = `
      <div class="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800 space-y-6">
        <div>
          <h4 class="text-lg font-bold text-white">The 50/30/20 Wealth Framework</h4>
          <p class="text-xs text-slate-400 mt-1">Recommended gold standard: 50% Needs, 30% Wants, 20% Savings & Debt Elimination</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <!-- Needs Pillar -->
          <div class="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold uppercase tracking-wider text-blue-400">Essential Needs</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">Target: 50%</span>
            </div>
            <div class="text-3xl font-extrabold text-white">${macroRatio.needs}%</div>
            <p class="text-xs text-slate-400">Housing, groceries, utilities, transit, medicine.</p>
            <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div class="h-full bg-blue-500" style="width: ${Math.min(100, macroRatio.needs * 2)}%"></div>
            </div>
            <div class="text-[11px] text-blue-300 font-medium">
              ${macroRatio.needs <= 50 ? '✓ Balanced within safe boundaries' : '⚠️ Essential overhead is high'}
            </div>
          </div>

          <!-- Wants Pillar -->
          <div class="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-400">Lifestyle & Wants</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">Target: 30%</span>
            </div>
            <div class="text-3xl font-extrabold text-white">${macroRatio.wants}%</div>
            <p class="text-xs text-slate-400">Dining out, entertainment, shopping, hobbies.</p>
            <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div class="h-full bg-amber-500" style="width: ${Math.min(100, (macroRatio.wants / 30) * 100)}%"></div>
            </div>
            <div class="text-[11px] text-amber-300 font-medium">
              ${macroRatio.wants <= 30 ? '✓ Discretionary spending well managed' : '⚠️ Elevated lifestyle spending'}
            </div>
          </div>

          <!-- Savings Pillar -->
          <div class="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-400">Savings & Investing</span>
              <span class="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Target: 20%</span>
            </div>
            <div class="text-3xl font-extrabold text-white">${macroRatio.savings}%</div>
            <p class="text-xs text-slate-400">Investments, emergency reserves, debt payoff.</p>
            <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div class="h-full bg-emerald-500" style="width: ${Math.min(100, (macroRatio.savings / 20) * 100)}%"></div>
            </div>
            <div class="text-[11px] text-emerald-300 font-medium">
              ${macroRatio.savings >= 20 ? '✓ Exceeding financial independence target!' : '⚠️ Aim to boost savings to 20%'}
            </div>
          </div>

        </div>
      </div>
    `;
  }

  // --- SUBVIEW 3: Zero-Based Envelopes ---
  function renderEnvelopeView(target, state, store, analysis, spendingMap, currency, isPrivacy) {
    const totalIncome = analysis.totalIncome || 4300;
    const totalAllocated = state.budgets.reduce((s, b) => s + Number(b.monthlyLimit), 0);
    const unallocated = totalIncome - totalAllocated;

    target.innerHTML = `
      <div class="space-y-6">
        
        <!-- YNAB Zero Allocation Banner -->
        <div class="p-5 rounded-2xl border ${
          unallocated === 0
            ? 'bg-emerald-500/10 border-emerald-500/30'
            : unallocated > 0
            ? 'bg-sky-500/10 border-sky-500/30'
            : 'bg-rose-500/10 border-rose-500/30'
        } flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">Monthly Income to Assign:</span>
            <div class="text-2xl font-bold text-white privacy-value">${formatCurrency(totalIncome, currency, isPrivacy)}</div>
          </div>
          <div class="text-center sm:text-right">
            <span class="text-xs font-semibold text-slate-400">
              ${unallocated === 0 ? '🎉 Every Dollar Has a Job!' : unallocated > 0 ? 'Dollars Ready to Assign:' : 'Over-Allocated by:'}
            </span>
            <div class="text-2xl font-extrabold ${unallocated === 0 ? 'text-emerald-400' : unallocated > 0 ? 'text-sky-400' : 'text-rose-400'} privacy-value">
              ${formatCurrency(Math.abs(unallocated), currency, isPrivacy)}
            </div>
          </div>
        </div>

        <!-- Envelopes Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          ${state.budgets.map(b => {
            const spent = spendingMap[b.category] || 0;
            const remaining = b.monthlyLimit - spent;

            return `
              <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-slate-200 text-sm">${b.category}</span>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">ENVELOPE</span>
                </div>
                <div class="flex justify-between items-baseline">
                  <span class="text-xs text-slate-400">Envelope Balance:</span>
                  <span class="text-base font-bold ${remaining < 0 ? 'text-rose-400' : 'text-emerald-400'} privacy-value">
                    ${formatCurrency(remaining, currency, isPrivacy)}
                  </span>
                </div>
                <div class="text-[11px] text-slate-500 flex justify-between">
                  <span>Assigned: ${formatCurrency(b.monthlyLimit, currency, isPrivacy)}</span>
                  <span>Spent: ${formatCurrency(spent, currency, isPrivacy)}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;
  }

  // --- SUBVIEW 4: Recurring Bills ---
  function renderBillsView(target, state, store, currency, isPrivacy) {
    const bills = state.recurringBills || [];
    const totalRecurring = bills.reduce((s, b) => s + b.amount, 0);

    target.innerHTML = `
      <div class="space-y-6">
        <div class="p-4 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
          <div>
            <h4 class="font-bold text-slate-200 text-sm">Committed Monthly Recurring Burn</h4>
            <p class="text-xs text-slate-400">Total fixed overhead automatically billed each month</p>
          </div>
          <div class="text-xl font-bold text-amber-400 privacy-value">${formatCurrency(totalRecurring, currency, isPrivacy)}</div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          ${bills.map(bill => `
            <div class="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                  <i data-lucide="calendar" class="w-4 h-4"></i>
                </div>
                <div>
                  <h5 class="font-bold text-slate-100 text-xs">${bill.name}</h5>
                  <span class="text-[11px] text-slate-400">Due on the ${bill.dueDate} • ${bill.category}</span>
                </div>
              </div>
              <div class="text-sm font-bold text-slate-200 privacy-value">
                ${formatCurrency(bill.amount, currency, isPrivacy)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  render();
}
