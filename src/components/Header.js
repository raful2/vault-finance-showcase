/**
 * Header Component with Privacy Blur, Currency Selector, and Quick Actions
 */

import { CURRENCY_SYMBOLS } from '../utils/formatters.js';

export function renderHeader(title, subtitle, state, store, onOpenAddTx, onOpenImportCsv) {
  const container = document.getElementById('header-container');
  if (!container) return;

  const isPrivacy = state.settings.privacyBlur;
  const currentCurrency = state.settings.primaryCurrency || 'USD';

  container.innerHTML = `
    <div>
      <h2 class="text-xl font-bold tracking-tight text-white">${title}</h2>
      <p class="text-xs text-slate-400 mt-0.5">${subtitle}</p>
    </div>

    <div class="flex items-center gap-3">
      <!-- Privacy Mode Toggle (Eye Icon) -->
      <button id="btn-privacy-toggle" title="${isPrivacy ? 'Disable Privacy Mask' : 'Enable Privacy Mask (hide amounts)'}" 
        class="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition-all ${
          isPrivacy
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
            : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
        }">
        <i data-lucide="${isPrivacy ? 'eye-off' : 'eye'}" class="w-4 h-4 ${isPrivacy ? 'text-amber-400' : ''}"></i>
        <span class="hidden sm:inline">${isPrivacy ? 'Privacy ON' : 'Privacy'}</span>
      </button>

      <!-- Currency Selector Quick Dropdown -->
      <div class="relative">
        <select id="select-currency" class="bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl px-3 py-2 pr-7 appearance-none cursor-pointer hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500">
          ${Object.keys(CURRENCY_SYMBOLS).map(curr => `
            <option value="${curr}" ${curr === currentCurrency ? 'selected' : ''}>
              ${CURRENCY_SYMBOLS[curr]} ${curr}
            </option>
          `).join('')}
        </select>
        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
          <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
        </div>
      </div>

      <!-- Import CSV Button -->
      <button id="btn-header-import-csv" class="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition">
        <i data-lucide="upload-cloud" class="w-4 h-4 text-sky-400"></i>
        <span>Import CSV</span>
      </button>

      <!-- New Transaction Button -->
      <button id="btn-header-add-tx" class="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition transform active:scale-95">
        <i data-lucide="plus-circle" class="w-4 h-4"></i>
        <span>New Transaction</span>
      </button>
    </div>
  `;

  // Attach Listeners
  const privacyBtn = container.querySelector('#btn-privacy-toggle');
  if (privacyBtn) {
    privacyBtn.addEventListener('click', () => {
      store.togglePrivacyBlur();
    });
  }

  const currencySelect = container.querySelector('#select-currency');
  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      store.setPrimaryCurrency(e.target.value);
    });
  }

  const addTxBtn = container.querySelector('#btn-header-add-tx');
  if (addTxBtn && onOpenAddTx) {
    addTxBtn.addEventListener('click', onOpenAddTx);
  }

  const importBtn = container.querySelector('#btn-header-import-csv');
  if (importBtn && onOpenImportCsv) {
    importBtn.addEventListener('click', onOpenImportCsv);
  }

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }
}
