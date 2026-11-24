/**
 * Transactions View with Search, Category Filter, and Management
 */

import { formatCurrency, formatDate } from '../../utils/formatters.js';

export function renderTransactions(container, state, store, onOpenAddTx, onOpenImportCsv) {
  const currency = state.settings.primaryCurrency || 'USD';
  const isPrivacy = state.settings.privacyBlur;

  let searchQuery = '';
  let selectedFilter = 'all'; // all, needs, wants, savings, income
  let selectedAccount = 'all';

  function getFilteredTransactions() {
    return (state.transactions || []).filter(tx => {
      // Bucket filter
      if (selectedFilter !== 'all' && tx.macroBucket !== selectedFilter) return false;

      // Account filter
      if (selectedAccount !== 'all' && tx.accountId !== selectedAccount) return false;

      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const payeeMatch = (tx.payee || '').toLowerCase().includes(q);
        const catMatch = (tx.category || '').toLowerCase().includes(q);
        const notesMatch = (tx.notes || '').toLowerCase().includes(q);
        if (!payeeMatch && !catMatch && !notesMatch) return false;
      }

      return true;
    });
  }

  function render() {
    const filtered = getFilteredTransactions();
    const categories = Array.from(new Set(state.transactions.map(t => t.category))).sort();

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Top Toolbar -->
        <div class="glass-card p-4 sm:p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center">
          
          <!-- Search & Filter Controls -->
          <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <!-- Search Input -->
            <div class="relative flex-1 sm:w-64">
              <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
              <input type="text" id="tx-search-input" placeholder="Search payee, category..." value="${searchQuery}"
                class="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500">
            </div>

            <!-- Macro Bucket Filter Pills -->
            <div class="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
              ${[
                { id: 'all', label: 'All' },
                { id: 'needs', label: 'Needs' },
                { id: 'wants', label: 'Wants' },
                { id: 'savings', label: 'Savings' },
                { id: 'income', label: 'Income' }
              ].map(f => `
                <button data-bucket-filter="${f.id}" class="px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedFilter === f.id
                    ? 'bg-sky-500 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }">
                  ${f.label}
                </button>
              `).join('')}
            </div>

            <!-- Account Filter Dropdown -->
            <select id="tx-account-select" class="bg-slate-900 border border-slate-700/80 text-slate-300 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500">
              <option value="all" ${selectedAccount === 'all' ? 'selected' : ''}>All Accounts</option>
              ${state.accounts.map(a => `
                <option value="${a.id}" ${selectedAccount === a.id ? 'selected' : ''}>${a.name}</option>
              `).join('')}
            </select>
          </div>

          <!-- Actions: Export CSV, Import CSV, New TX -->
          <div class="flex items-center gap-2.5 w-full md:w-auto justify-end">
            <button id="btn-export-csv" title="Export transactions to CSV" class="p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-1.5 transition">
              <i data-lucide="download" class="w-4 h-4 text-slate-400"></i>
              <span class="hidden sm:inline">Export</span>
            </button>

            <button id="btn-tx-import-csv" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition">
              <i data-lucide="upload-cloud" class="w-4 h-4 text-sky-400"></i>
              <span>Import Statement</span>
            </button>

            <button id="btn-tx-add" class="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 flex items-center gap-1.5 transition">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add Entry</span>
            </button>
          </div>
        </div>

        <!-- Transactions Ledger Table -->
        <div class="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-900/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th class="py-3 px-4">Date</th>
                  <th class="py-3 px-4">Payee & Merchant</th>
                  <th class="py-3 px-4">Category</th>
                  <th class="py-3 px-4">Account</th>
                  <th class="py-3 px-4 text-right">Amount</th>
                  <th class="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                ${filtered.length === 0 ? `
                  <tr>
                    <td colspan="6" class="py-12 text-center text-slate-500">
                      <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>
                      <p class="font-medium">No transactions found matching your filter</p>
                      <p class="text-[11px] mt-1">Try clearing your search query or import a statement.</p>
                    </td>
                  </tr>
                ` : filtered.map(tx => {
                  const acc = state.accounts.find(a => a.id === tx.accountId);
                  const isPositive = Number(tx.amount) > 0;

                  return `
                    <tr class="hover:bg-slate-800/40 transition group">
                      <td class="py-3.5 px-4 font-medium text-slate-400 whitespace-nowrap">
                        ${formatDate(tx.date)}
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="font-semibold text-slate-100 flex items-center gap-2">
                          <span>${tx.payee}</span>
                          ${tx.isRecurring ? `
                            <span class="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 border border-slate-700" title="Recurring subscription or bill">
                              <i data-lucide="repeat" class="w-2.5 h-2.5 inline mr-0.5"></i> recurring
                            </span>
                          ` : ''}
                        </div>
                        ${tx.notes ? `<div class="text-[11px] text-slate-400 truncate max-w-xs">${tx.notes}</div>` : ''}
                      </td>
                      <td class="py-3.5 px-4 whitespace-nowrap">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                          tx.macroBucket === 'needs' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                          tx.macroBucket === 'wants' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          tx.macroBucket === 'savings' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                        }">
                          <span class="w-1.5 h-1.5 rounded-full ${
                            tx.macroBucket === 'needs' ? 'bg-blue-400' :
                            tx.macroBucket === 'wants' ? 'bg-amber-400' :
                            tx.macroBucket === 'savings' ? 'bg-emerald-400' : 'bg-indigo-400'
                          }"></span>
                          ${tx.category}
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        ${acc ? acc.name : 'Unknown Account'}
                      </td>
                      <td class="py-3.5 px-4 text-right whitespace-nowrap font-bold text-sm ${
                        isPositive ? 'text-emerald-400' : 'text-slate-100'
                      } privacy-value">
                        ${isPositive ? '+' : ''}${formatCurrency(tx.amount, tx.currency || currency, isPrivacy)}
                      </td>
                      <td class="py-3.5 px-4 text-center whitespace-nowrap">
                        <button data-delete-tx="${tx.id}" title="Delete transaction"
                          class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100">
                          <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Footer Count -->
          <div class="p-3 bg-slate-900/60 border-t border-slate-800 text-xs text-slate-400 flex justify-between items-center px-4">
            <span>Showing ${filtered.length} of ${state.transactions.length} records</span>
            <span>Total Filtered: <strong class="text-slate-200 privacy-value">${formatCurrency(filtered.reduce((s,t)=>s+Number(t.amount), 0), currency, isPrivacy)}</strong></span>
          </div>
        </div>
      </div>
    `;

    // Attach Event Listeners
    const searchInput = container.querySelector('#tx-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        render();
        // Restore focus
        const nextInput = container.querySelector('#tx-search-input');
        if (nextInput) {
          nextInput.focus();
          nextInput.setSelectionRange(searchQuery.length, searchQuery.length);
        }
      });
    }

    container.querySelectorAll('button[data-bucket-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedFilter = btn.getAttribute('data-bucket-filter');
        render();
      });
    });

    const accountSelect = container.querySelector('#tx-account-select');
    if (accountSelect) {
      accountSelect.addEventListener('change', (e) => {
        selectedAccount = e.target.value;
        render();
      });
    }

    const exportBtn = container.querySelector('#btn-export-csv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => store.exportCsv());
    }

    const importBtn = container.querySelector('#btn-tx-import-csv');
    if (importBtn && onOpenImportCsv) {
      importBtn.addEventListener('click', onOpenImportCsv);
    }

    const addBtn = container.querySelector('#btn-tx-add');
    if (addBtn && onOpenAddTx) {
      addBtn.addEventListener('click', onOpenAddTx);
    }

    container.querySelectorAll('button[data-delete-tx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-delete-tx');
        if (confirm('Are you sure you want to delete this transaction?')) {
          store.deleteTransaction(id);
          render();
        }
      });
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }
  }

  render();
}
