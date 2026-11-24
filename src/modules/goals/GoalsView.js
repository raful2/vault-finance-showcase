/**
 * Savings Goals View with Direct Transfer / Deposit Support
 */

import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters.js';

export function renderGoals(container, state, store) {
  const currency = state.settings.primaryCurrency || 'USD';
  const isPrivacy = state.settings.privacyBlur;

  function render() {
    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Header -->
        <div class="glass-card p-5 rounded-2xl border border-slate-800 flex justify-between items-center">
          <div>
            <h3 class="font-bold text-slate-100 text-base">Savings Goals & Milestones</h3>
            <p class="text-xs text-slate-400">Target funds for emergency cushions, travel, and long-term milestones</p>
          </div>
          <button id="btn-add-goal" class="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 flex items-center gap-1.5 transition">
            <i data-lucide="plus" class="w-4 h-4"></i>
            <span>New Goal</span>
          </button>
        </div>

        <!-- Goals Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          ${state.goals.map(goal => {
            const current = Number(goal.currentAmount) || 0;
            const target = Number(goal.targetAmount) || 1;
            const pct = Math.min(100, Math.round((current / target) * 100));
            const remaining = Math.max(0, target - current);

            return `
              <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-slate-700 transition flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between mb-3">
                    <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm" style="background-color: ${goal.color || '#3b82f6'}20; color: ${goal.color || '#3b82f6'}; border: 1px solid ${goal.color || '#3b82f6'}40">
                      <i data-lucide="${goal.icon || 'target'}" class="w-5 h-5"></i>
                    </div>
                    <span class="text-xs font-bold px-2.5 py-0.5 rounded-full ${pct >= 100 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-300'}">
                      ${pct}% Reached
                    </span>
                  </div>

                  <h4 class="font-bold text-slate-100 text-sm mb-1">${goal.title}</h4>
                  <p class="text-xs text-slate-400 mb-3">${goal.notes || 'Target savings milestone'}</p>

                  <div class="flex justify-between items-baseline mb-2">
                    <span class="text-xl font-extrabold text-white privacy-value">${formatCurrency(current, currency, isPrivacy)}</span>
                    <span class="text-xs text-slate-400">Target: <strong class="text-slate-300 privacy-value">${formatCurrency(target, currency, isPrivacy)}</strong></span>
                  </div>

                  <!-- Progress Bar -->
                  <div class="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background-color: ${goal.color || '#3b82f6'}"></div>
                  </div>

                  <div class="flex justify-between text-[11px] text-slate-400 mt-2">
                    <span>${pct >= 100 ? '🎉 Target Achieved!' : `${formatCurrency(remaining, currency, isPrivacy)} to go`}</span>
                    ${goal.targetDate ? `<span>Target: ${formatDate(goal.targetDate)}</span>` : ''}
                  </div>
                </div>

                <!-- Action Button -->
                <div class="pt-4 border-t border-slate-800/80 flex gap-2">
                  <button data-deposit-goal="${goal.id}" class="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-sky-500/15 text-sky-300 hover:bg-sky-500/25 border border-sky-500/30 flex items-center justify-center gap-1.5 transition">
                    <i data-lucide="arrow-down-circle" class="w-3.5 h-3.5"></i>
                    <span>Deposit Funds</span>
                  </button>
                  <button data-delete-goal="${goal.id}" title="Delete goal" class="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

      </div>
    `;

    // Attach deposit listeners
    container.querySelectorAll('button[data-deposit-goal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const goalId = btn.getAttribute('data-deposit-goal');
        openDepositModal(goalId, state, store, () => render());
      });
    });

    container.querySelectorAll('button[data-delete-goal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const goalId = btn.getAttribute('data-delete-goal');
        if (confirm('Delete this goal?')) {
          store.deleteGoal(goalId);
          render();
        }
      });
    });

    const addGoalBtn = container.querySelector('#btn-add-goal');
    if (addGoalBtn) {
      addGoalBtn.addEventListener('click', () => {
        openAddGoalModal(state, store, () => render());
      });
    }

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }
  }

  render();
}

function openDepositModal(goalId, state, store, onDone) {
  const modalContainer = document.getElementById('modal-container');
  const goal = state.goals.find(g => g.id === goalId);
  if (!modalContainer || !goal) return;

  const checkingAccs = state.accounts.filter(a => a.type === 'checking' || a.type === 'savings' || a.type === 'cash');

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-surface-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <h4 class="font-bold text-slate-100 text-sm">Deposit to ${goal.title}</h4>
        
        <div>
          <label class="block text-xs text-slate-400 mb-1">Transfer From Account</label>
          <select id="deposit-from-acc" class="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5">
            ${checkingAccs.map(a => `
              <option value="${a.id}">${a.name} ($${a.balance.toFixed(2)})</option>
            `).join('')}
          </select>
        </div>

        <div>
          <label class="block text-xs text-slate-400 mb-1">Amount to Allocate</label>
          <input type="number" step="10" min="1" id="deposit-amount" value="100" class="w-full bg-slate-950 border border-slate-700 text-slate-100 font-bold text-lg rounded-xl p-2.5">
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button id="btn-cancel-deposit" class="px-3 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
          <button id="btn-confirm-deposit" class="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-500 text-white hover:bg-sky-400">Confirm Deposit</button>
        </div>
      </div>
    </div>
  `;

  modalContainer.querySelector('#btn-cancel-deposit').addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  modalContainer.querySelector('#btn-confirm-deposit').addEventListener('click', () => {
    const fromId = modalContainer.querySelector('#deposit-from-acc').value;
    const amt = parseFloat(modalContainer.querySelector('#deposit-amount').value);
    if (amt > 0) {
      store.depositToGoal(goalId, amt, fromId);
    }
    modalContainer.innerHTML = '';
    onDone();
  });
}

function openAddGoalModal(state, store, onDone) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-surface-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
        <h4 class="font-bold text-slate-100 text-sm">Create Savings Milestone</h4>
        
        <div>
          <label class="block text-xs text-slate-400 mb-1">Goal Name</label>
          <input type="text" id="goal-name" placeholder="e.g. New Laptop, Wedding" class="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5">
        </div>

        <div>
          <label class="block text-xs text-slate-400 mb-1">Target Amount ($)</label>
          <input type="number" step="50" min="10" id="goal-target" placeholder="2500" class="w-full bg-slate-950 border border-slate-700 text-slate-100 text-xs font-bold rounded-xl p-2.5">
        </div>

        <div>
          <label class="block text-xs text-slate-400 mb-1">Target Date</label>
          <input type="date" id="goal-date" class="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl p-2.5">
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button id="btn-cancel-add-goal" class="px-3 py-2 text-xs text-slate-400 hover:text-white">Cancel</button>
          <button id="btn-save-new-goal" class="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-500 text-white hover:bg-sky-400">Save Goal</button>
        </div>
      </div>
    </div>
  `;

  modalContainer.querySelector('#btn-cancel-add-goal').addEventListener('click', () => {
    modalContainer.innerHTML = '';
  });

  modalContainer.querySelector('#btn-save-new-goal').addEventListener('click', () => {
    const title = modalContainer.querySelector('#goal-name').value;
    const targetAmount = parseFloat(modalContainer.querySelector('#goal-target').value);
    const targetDate = modalContainer.querySelector('#goal-date').value;

    if (title && targetAmount > 0) {
      store.addGoal({
        title,
        targetAmount,
        currentAmount: 0,
        targetDate,
        icon: 'target',
        color: '#3b82f6'
      });
    }
    modalContainer.innerHTML = '';
    onDone();
  });
}
