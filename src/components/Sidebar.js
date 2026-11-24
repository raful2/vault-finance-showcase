/**
 * Sidebar Navigation Component
 */

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'layout-dashboard', badge: null },
  { id: 'transactions', label: 'Transactions', icon: 'receipt', badge: null },
  { id: 'budgets', label: 'Budgets & Cash Flow', icon: 'pie-chart', badge: null },
  { id: 'investments', label: 'Investments & Assets', icon: 'trending-up', badge: 'Live' },
  { id: 'goals', label: 'Savings Goals', icon: 'target', badge: null },
  { id: 'debt', label: 'Debt Simulator', icon: 'zap', badge: 'Payoff' },
  { id: 'insights', label: 'Smart Insights', icon: 'sparkles', badge: 'AI' },
  { id: 'settings', label: 'Settings & Cloud', icon: 'settings', badge: null }
];

export function renderSidebar(currentTab, onTabSelect, state) {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const txCount = state.transactions ? state.transactions.length : 0;
  const isCloud = state.settings.supabaseUrl && state.settings.supabaseKey;

  container.innerHTML = `
    <div class="p-6 flex items-center gap-3 border-b border-slate-800">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-bold">
        <i data-lucide="shield-check" class="w-6 h-6"></i>
      </div>
      <div>
        <h1 class="font-bold text-lg tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">VaultFinance</h1>
        <p class="text-xs text-slate-400 font-medium">Personal Finance OS</p>
      </div>
    </div>

    <!-- Nav List -->
    <nav class="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
      ${NAV_ITEMS.map(item => {
        const isActive = item.id === currentTab;
        const countBadge = item.id === 'transactions' && txCount > 0 ? txCount : null;

        return `
          <button data-nav-id="${item.id}" class="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
            isActive
              ? 'bg-sky-500/15 text-sky-400 font-semibold border border-sky-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }">
            <div class="flex items-center gap-3">
              <i data-lucide="${item.icon}" class="w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}"></i>
              <span>${item.label}</span>
            </div>
            ${item.badge ? `
              <span class="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                ${item.badge}
              </span>
            ` : ''}
            ${countBadge ? `
              <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-800 text-slate-400">
                ${countBadge}
              </span>
            ` : ''}
          </button>
        `;
      }).join('')}
    </nav>

    <!-- Bottom Status Card -->
    <div class="p-4 border-t border-slate-800 bg-surface-950/40">
      <div class="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-slate-400">Data Engine</span>
          <span class="flex items-center gap-1.5 font-medium ${isCloud ? 'text-emerald-400' : 'text-amber-400'}">
            <span class="w-2 h-2 rounded-full ${isCloud ? 'bg-emerald-400' : 'bg-amber-400'}"></span>
            ${isCloud ? 'Supabase Sync' : 'Local + Offline'}
          </span>
        </div>
        <div class="flex items-center justify-between text-xs pt-1 border-t border-slate-700/30 text-slate-400">
          <span>Currency</span>
          <span class="font-semibold text-slate-200">${state.settings.primaryCurrency}</span>
        </div>
      </div>
    </div>
  `;

  // Attach nav handlers
  container.querySelectorAll('button[data-nav-id]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-nav-id');
      if (id) onTabSelect(id);
    });
  });

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }
}
