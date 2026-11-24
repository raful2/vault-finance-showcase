/**
 * Sidebar Navigation Component with Multi-User Profile Dropdown
 */

import { getInitials } from '../utils/authUtils.js';

export const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'layout-dashboard', badge: null },
  { id: 'transactions', label: 'Transactions', icon: 'receipt', badge: null },
  { id: 'budgets', label: 'Budgets & Cash Flow', icon: 'pie-chart', badge: null },
  { id: 'investments', label: 'Investments & Assets', icon: 'trending-up', badge: 'Live' },
  { id: 'goals', label: 'Savings Goals', icon: 'target', badge: null },
  { id: 'debt', label: 'Debt Simulator', icon: 'zap', badge: 'Payoff' },
  { id: 'insights', label: 'Smart Insights', icon: 'sparkles', badge: 'AI' },
  { id: 'settings', label: 'Settings', icon: 'settings', badge: null }
];

export function renderSidebar(currentTab, onTabSelect, state, store) {
  const container = document.getElementById('sidebar-container');
  if (!container) return;

  const txCount = state.transactions ? state.transactions.length : 0;
  const currentUser = state.auth?.currentUser || {
    name: 'VaultFinance User',
    email: 'user@vaultfinance.app',
    role: 'admin',
    avatarColor: '#3b82f6'
  };
  const isDemo = state.auth?.isDemo;
  const initials = getInitials(currentUser.name);

  container.innerHTML = `
    <!-- App Brand -->
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

    <!-- User Profile & Session Card -->
    <div class="p-3 border-t border-slate-800 bg-surface-950/60 relative">
      <div id="user-profile-trigger" class="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center justify-between hover:bg-slate-800/70 transition cursor-pointer">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white text-xs shrink-0" style="background-color: ${currentUser.avatarColor || '#3b82f6'}">
            ${initials}
          </div>
          <div class="min-w-0">
            <div class="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
              <span class="truncate">${currentUser.name}</span>
              ${isDemo ? `<span class="px-1 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300">DEMO</span>` : ''}
            </div>
            <div class="text-[10px] text-slate-400 truncate">${currentUser.email}</div>
          </div>
        </div>
        <i data-lucide="more-vertical" class="w-4 h-4 text-slate-400 shrink-0"></i>
      </div>

      <!-- Dropdown Menu -->
      <div id="user-dropdown-menu" class="hidden absolute bottom-16 left-3 right-3 bg-surface-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-30 space-y-1">
        <button id="btn-menu-settings" class="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-slate-800 transition flex items-center gap-2.5">
          <i data-lucide="user" class="w-4 h-4 text-sky-400"></i>
          <span>My Profile & Settings</span>
        </button>

        <button id="btn-menu-logout" class="w-full text-left px-3 py-2 rounded-xl text-xs text-rose-300 hover:bg-rose-500/20 transition flex items-center gap-2.5">
          <i data-lucide="log-out" class="w-4 h-4 text-rose-400"></i>
          <span>${isDemo ? 'Exit Demo' : 'Sign Out'}</span>
        </button>
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

  // User Profile Dropdown handlers
  const trigger = container.querySelector('#user-profile-trigger');
  const menu = container.querySelector('#user-dropdown-menu');

  if (trigger && menu) {
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => {
      menu.classList.add('hidden');
    });

    const btnSettings = container.querySelector('#btn-menu-settings');
    if (btnSettings) {
      btnSettings.addEventListener('click', () => {
        onTabSelect('settings');
        menu.classList.add('hidden');
      });
    }

    const btnLogout = container.querySelector('#btn-menu-logout');
    if (btnLogout && store) {
      btnLogout.addEventListener('click', () => {
        store.logout();
      });
    }
  }

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }
}
