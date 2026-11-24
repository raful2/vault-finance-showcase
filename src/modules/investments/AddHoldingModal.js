/**
 * Add / Edit Investment Asset Modal
 */

export function openAddHoldingModal(state, store, existingHolding = null, onComplete) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  const isEditing = Boolean(existingHolding);
  const currency = state.settings.primaryCurrency || 'USD';

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-surface-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        <!-- Header -->
        <div class="p-5 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
              <i data-lucide="${isEditing ? 'pencil' : 'trending-up'}" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-100 text-base">${isEditing ? 'Edit Asset Holding' : 'Add Investment Asset'}</h3>
              <p class="text-xs text-slate-400">Track stocks, ETFs, crypto, bonds, or real estate in your portfolio</p>
            </div>
          </div>
          <button id="btn-close-holding-modal" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Form -->
        <form id="form-holding" class="p-6 space-y-4 text-xs">
          
          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Symbol / Ticker *</label>
              <input type="text" id="hold-symbol" required uppercase placeholder="VOO, AAPL, BTC" value="${existingHolding?.symbol || ''}"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-sky-500">
            </div>
            <div class="col-span-2">
              <label class="block text-slate-400 font-semibold mb-1">Asset Name *</label>
              <input type="text" id="hold-name" required placeholder="e.g. Vanguard S&P 500 ETF" value="${existingHolding?.name || ''}"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Asset Class</label>
              <select id="hold-class" class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-sky-500">
                <option value="etf" ${existingHolding?.assetClass === 'etf' ? 'selected' : ''}>ETF / Index Fund</option>
                <option value="stock" ${existingHolding?.assetClass === 'stock' ? 'selected' : ''}>Individual Stock</option>
                <option value="crypto" ${existingHolding?.assetClass === 'crypto' ? 'selected' : ''}>Cryptocurrency</option>
                <option value="bond" ${existingHolding?.assetClass === 'bond' ? 'selected' : ''}>Bonds & Fixed Income</option>
                <option value="real_estate" ${existingHolding?.assetClass === 'real_estate' ? 'selected' : ''}>Real Estate / REIT</option>
                <option value="other" ${existingHolding?.assetClass === 'other' ? 'selected' : ''}>Other Asset</option>
              </select>
            </div>

            <div>
              <label class="block text-slate-400 font-semibold mb-1">Target Allocation (%)</label>
              <input type="number" step="1" min="0" max="100" id="hold-target-pct" value="${existingHolding?.targetAllocationPct ?? 20}"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 focus:ring-2 focus:ring-sky-500">
            </div>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div>
              <label class="block text-slate-400 font-semibold mb-1">Shares / Units *</label>
              <input type="number" step="any" min="0.000001" id="hold-shares" required placeholder="10.5" value="${existingHolding?.shares ?? ''}"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold focus:ring-2 focus:ring-sky-500">
            </div>

            <div>
              <label class="block text-slate-400 font-semibold mb-1">Cost Basis / Share ($)</label>
              <input type="number" step="0.01" min="0" id="hold-cost" required placeholder="100.00" value="${existingHolding?.costBasis ?? ''}"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-200 font-mono focus:ring-2 focus:ring-sky-500">
            </div>

            <div>
              <label class="block text-slate-400 font-semibold mb-1">Current Price ($)</label>
              <input type="number" step="0.01" min="0" id="hold-price" required placeholder="110.00" value="${existingHolding?.currentPrice ?? ''}"
                class="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono font-bold text-emerald-400 focus:ring-2 focus:ring-sky-500">
            </div>
          </div>

          <!-- Dividend Configuration -->
          <div class="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
            <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Passive Income / Dividends</span>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Dividend Yield (% annual)</label>
                <input type="number" step="0.01" min="0" id="hold-div-yield" placeholder="1.50" value="${existingHolding?.dividendYield ?? 0}"
                  class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200">
              </div>
              <div>
                <label class="block text-[11px] text-slate-400 mb-1">Payment Frequency</label>
                <select id="hold-div-freq" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-200">
                  <option value="quarterly" ${existingHolding?.dividendFrequency === 'quarterly' ? 'selected' : ''}>Quarterly</option>
                  <option value="monthly" ${existingHolding?.dividendFrequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                  <option value="annual" ${existingHolding?.dividendFrequency === 'annual' ? 'selected' : ''}>Annual</option>
                  <option value="none" ${existingHolding?.dividendFrequency === 'none' ? 'selected' : ''}>None (Growth)</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="pt-3 border-t border-slate-800 flex justify-end gap-3">
            <button type="button" id="btn-cancel-holding" class="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition">Cancel</button>
            <button type="submit" class="px-5 py-2.5 rounded-xl font-bold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition">
              ${isEditing ? 'Save Changes' : 'Add to Portfolio'}
            </button>
          </div>

        </form>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: modalContainer });

  const closeModal = () => { modalContainer.innerHTML = ''; };
  modalContainer.querySelector('#btn-close-holding-modal').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-cancel-holding').addEventListener('click', closeModal);

  const form = modalContainer.querySelector('#form-holding');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const symbol = modalContainer.querySelector('#hold-symbol').value.trim().toUpperCase();
    const name = modalContainer.querySelector('#hold-name').value.trim();
    const assetClass = modalContainer.querySelector('#hold-class').value;
    const targetAllocationPct = parseFloat(modalContainer.querySelector('#hold-target-pct').value) || 0;
    const shares = parseFloat(modalContainer.querySelector('#hold-shares').value) || 0;
    const costBasis = parseFloat(modalContainer.querySelector('#hold-cost').value) || 0;
    const currentPrice = parseFloat(modalContainer.querySelector('#hold-price').value) || costBasis;
    const dividendYield = parseFloat(modalContainer.querySelector('#hold-div-yield').value) || 0;
    const dividendFrequency = modalContainer.querySelector('#hold-div-freq').value;

    const payload = {
      symbol,
      name,
      assetClass,
      targetAllocationPct,
      shares,
      costBasis,
      currentPrice,
      dividendYield,
      dividendFrequency,
      accountId: 'acc-4'
    };

    if (isEditing) {
      store.editHolding(existingHolding.id, payload);
    } else {
      store.addHolding(payload);
    }

    closeModal();
    if (onComplete) onComplete(symbol);
  });
}
