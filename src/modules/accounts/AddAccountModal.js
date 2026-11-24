/**
 * Add / Edit Financial Account Modal
 */

export function openAddAccountModal(state, store, onComplete) {
  const existingModal = document.getElementById('add-account-modal');
  if (existingModal) existingModal.remove();

  const primaryCurr = state.settings?.primaryCurrency || 'USD';

  const modal = document.createElement('div');
  modal.id = 'add-account-modal';
  modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in';

  modal.innerHTML = `
    <div class="glass-card bg-surface-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5 text-slate-100">
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center">
            <i data-lucide="landmark" class="w-5 h-5"></i>
          </div>
          <div>
            <h3 class="font-bold text-base text-slate-100">Add Financial Account</h3>
            <p class="text-xs text-slate-400">Track checking, savings, credit cards or investments</p>
          </div>
        </div>
        <button id="btn-close-modal" class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition">
          <i data-lucide="x" class="w-5 h-5"></i>
        </button>
      </div>

      <form id="form-add-account" class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Account Name *</label>
          <input type="text" id="acc-name" required placeholder="e.g. Chase Sapphire Preferred or Ally Savings"
            class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500">
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Institution *</label>
            <input type="text" id="acc-institution" required placeholder="e.g. Chase, Vanguard, Marcus"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Account Type *</label>
            <select id="acc-type" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="checking">Checking</option>
              <option value="savings">Savings / HYSA</option>
              <option value="credit">Credit Card (Liability)</option>
              <option value="investment">Investment / Brokerage</option>
              <option value="cash">Cash / Other Asset</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Starting Balance *</label>
            <input type="number" step="0.01" id="acc-balance" required placeholder="0.00"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500">
            <span class="text-[10px] text-slate-400">For credit cards, enter current owed balance (will record as liability).</span>
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-300 mb-1">Last 4 Digits</label>
            <input type="text" maxlength="4" id="acc-mask" placeholder="1234"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono">
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-300 mb-1">Accent Color</label>
          <div class="flex items-center gap-3">
            <input type="color" id="acc-color" value="#3b82f6" class="w-10 h-8 rounded cursor-pointer bg-transparent border-0">
            <span class="text-xs text-slate-400">Color used on cards & charts</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button type="button" id="btn-cancel" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition">
            Cancel
          </button>
          <button type="submit" class="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition">
            Add Account
          </button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);
  if (window.lucide) window.lucide.createIcons({ root: modal });

  const close = () => modal.remove();
  modal.querySelector('#btn-close-modal').addEventListener('click', close);
  modal.querySelector('#btn-cancel').addEventListener('click', close);

  const form = modal.querySelector('#form-add-account');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = modal.querySelector('#acc-name').value.trim();
    const institution = modal.querySelector('#acc-institution').value.trim();
    const type = modal.querySelector('#acc-type').value;
    let balance = parseFloat(modal.querySelector('#acc-balance').value) || 0;
    const mask = modal.querySelector('#acc-mask').value.trim() || '0000';
    const color = modal.querySelector('#acc-color').value;

    // If it's a credit card and entered as positive, make it negative liability
    if (type === 'credit' && balance > 0) {
      balance = -balance;
    }

    const newAccount = {
      id: `acc-${Date.now()}`,
      name,
      institution,
      type,
      balance,
      currency: primaryCurr,
      mask,
      color
    };

    store.addAccount(newAccount);
    close();
    if (onComplete) onComplete(newAccount);
  });
}
