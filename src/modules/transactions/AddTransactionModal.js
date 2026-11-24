/**
 * Quick Add / Edit Transaction Modal
 */

export function openAddTransactionModal(state, store, onComplete) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  const currency = state.settings.primaryCurrency || 'USD';
  const categories = [
    { name: 'Income', macro: 'income' },
    { name: 'Side Hustle', macro: 'income' },
    { name: 'Rent & Housing', macro: 'needs' },
    { name: 'Groceries', macro: 'needs' },
    { name: 'Utilities', macro: 'needs' },
    { name: 'Transportation', macro: 'needs' },
    { name: 'Healthcare', macro: 'needs' },
    { name: 'Dining & Restaurants', macro: 'wants' },
    { name: 'Shopping', macro: 'wants' },
    { name: 'Subscriptions', macro: 'wants' },
    { name: 'Coffee & Snacks', macro: 'wants' },
    { name: 'Investment & Emergency', macro: 'savings' }
  ];

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-surface-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <div class="p-5 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
              <i data-lucide="plus-circle" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-100 text-base">New Transaction</h3>
              <p class="text-xs text-slate-400">Record an expense, income, or transfer</p>
            </div>
          </div>
          <button id="btn-close-tx-modal" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <form id="form-new-tx" class="p-6 space-y-4 text-xs">
          
          <!-- Type Toggle (Expense vs Income) -->
          <div class="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button type="button" id="btn-type-expense" class="flex-1 py-2 rounded-lg font-bold transition bg-rose-500/20 text-rose-300 border border-rose-500/30">
              Expense (-)
            </button>
            <button type="button" id="btn-type-income" class="flex-1 py-2 rounded-lg font-medium text-slate-400 hover:text-white transition">
              Income (+)
            </button>
          </div>

          <!-- Amount & Currency -->
          <div>
            <label class="block text-slate-400 font-medium mb-1">Amount (${currency})</label>
            <input type="number" step="0.01" min="0.01" id="input-tx-amount" required placeholder="0.00"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>

          <!-- Payee / Merchant -->
          <div>
            <label class="block text-slate-400 font-medium mb-1">Payee / Description</label>
            <input type="text" id="input-tx-payee" required placeholder="e.g. Target, Trader Joe's, Paycheck"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>

          <!-- Category & Account Grid -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 font-medium mb-1">Category</label>
              <select id="select-tx-category" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                ${categories.map(c => `
                  <option value="${c.name}" data-macro="${c.macro}">${c.name}</option>
                `).join('')}
              </select>
            </div>

            <div>
              <label class="block text-slate-400 font-medium mb-1">Account</label>
              <select id="select-tx-account" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                ${state.accounts.map(a => `
                  <option value="${a.id}">${a.name}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Date -->
          <div>
            <label class="block text-slate-400 font-medium mb-1">Date</label>
            <input type="date" id="input-tx-date" value="${new Date().toISOString().slice(0, 10)}"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none">
          </div>

          <!-- Notes -->
          <div>
            <label class="block text-slate-400 font-medium mb-1">Notes (Optional)</label>
            <input type="text" id="input-tx-notes" placeholder="Additional details..."
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-sky-500 focus:outline-none">
          </div>

          <!-- Recurring checkbox -->
          <div class="flex items-center gap-2 pt-1">
            <input type="checkbox" id="check-tx-recurring" class="rounded bg-slate-950 border-slate-700 text-sky-500 focus:ring-sky-500">
            <label for="check-tx-recurring" class="text-slate-300">Mark as recurring monthly bill or subscription</label>
          </div>

          <div class="pt-4 flex justify-end gap-3 border-t border-slate-800">
            <button type="button" id="btn-cancel-tx" class="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition">Cancel</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition">
              Save Transaction
            </button>
          </div>

        </form>

      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: modalContainer });
  }

  const closeModal = () => {
    modalContainer.innerHTML = '';
  };

  modalContainer.querySelector('#btn-close-tx-modal').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-cancel-tx').addEventListener('click', closeModal);

  let isExpense = true;
  const btnExpense = modalContainer.querySelector('#btn-type-expense');
  const btnIncome = modalContainer.querySelector('#btn-type-income');

  btnExpense.addEventListener('click', () => {
    isExpense = true;
    btnExpense.className = 'flex-1 py-2 rounded-lg font-bold transition bg-rose-500/20 text-rose-300 border border-rose-500/30';
    btnIncome.className = 'flex-1 py-2 rounded-lg font-medium text-slate-400 hover:text-white transition';
  });

  btnIncome.addEventListener('click', () => {
    isExpense = false;
    btnIncome.className = 'flex-1 py-2 rounded-lg font-bold transition bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
    btnExpense.className = 'flex-1 py-2 rounded-lg font-medium text-slate-400 hover:text-white transition';
  });

  const form = modalContainer.querySelector('#form-new-tx');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const amountVal = parseFloat(modalContainer.querySelector('#input-tx-amount').value);
    const payeeVal = modalContainer.querySelector('#input-tx-payee').value;
    const catSelect = modalContainer.querySelector('#select-tx-category');
    const categoryVal = catSelect.value;
    const macroVal = catSelect.options[catSelect.selectedIndex].getAttribute('data-macro') || 'wants';
    const accountIdVal = modalContainer.querySelector('#select-tx-account').value;
    const dateVal = modalContainer.querySelector('#input-tx-date').value;
    const notesVal = modalContainer.querySelector('#input-tx-notes').value;
    const isRecurringVal = modalContainer.querySelector('#check-tx-recurring').checked;

    const finalAmount = isExpense ? -Math.abs(amountVal) : Math.abs(amountVal);

    store.addTransaction({
      date: dateVal,
      payee: payeeVal,
      category: categoryVal,
      macroBucket: isExpense ? macroVal : 'income',
      amount: finalAmount,
      accountId: accountIdVal,
      currency,
      notes: notesVal,
      isRecurring: isRecurringVal
    });

    closeModal();
    if (onComplete) onComplete();
  });
}
