/**
 * VaultFinance Main Application Coordinator
 * Handles modular routing, reactivity, and global modals
 */

import { store } from './store.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderHeader } from './components/Header.js';
import { renderOverview } from './modules/overview/OverviewView.js';
import { renderTransactions } from './modules/transactions/TransactionsView.js';
import { renderBudgets } from './modules/budgets/BudgetsView.js';
import { renderGoals } from './modules/goals/GoalsView.js';
import { renderDebt } from './modules/debt/DebtView.js';
import { renderInsights } from './modules/insights/InsightsView.js';
import { renderSettings } from './modules/settings/SettingsView.js';
import { openAddTransactionModal } from './modules/transactions/AddTransactionModal.js';
import { openCsvImportModal } from './modules/transactions/CsvImportModal.js';

class App {
  constructor() {
    this.currentTab = 'overview';
    this.mainContentEl = document.getElementById('main-content');
    
    // Subscribe to central store
    this.unsubscribe = store.subscribe((state) => {
      this.handleStateChange(state);
    });

    this.init();
  }

  init() {
    this.render();
  }

  navigateTo(tabId) {
    this.currentTab = tabId;
    this.render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  handleStateChange(state) {
    // Sync privacy blur class on body
    if (state.settings.privacyBlur) {
      document.body.classList.add('privacy-blurred');
    } else {
      document.body.classList.remove('privacy-blurred');
    }

    this.render();
  }

  showToast(message, type = 'success') {
    const toastContainer = document.getElementById('toast-container');
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl text-xs font-semibold shadow-2xl flex items-center gap-2 pointer-events-auto transition transform duration-200 border ${
      type === 'success'
        ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-500/10'
        : 'bg-slate-900/90 text-slate-200 border-slate-700'
    }`;
    toast.innerHTML = `
      <i data-lucide="${type === 'success' ? 'check-circle-2' : 'info'}" class="w-4 h-4 text-emerald-400"></i>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);
    if (window.lucide) window.lucide.createIcons({ root: toast });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3000);
  }

  render() {
    const state = store.getState();

    // 1. Render Sidebar
    renderSidebar(this.currentTab, (tabId) => this.navigateTo(tabId), state);

    // 2. Titles per tab
    const tabMetadata = {
      overview: { title: 'Financial Overview', subtitle: 'Net worth, asset allocation, and cash flow trajectory' },
      transactions: { title: 'Transaction Ledger', subtitle: 'Search, filter, categorize, and bank statement uploads' },
      budgets: { title: 'Budgeting & Allocations', subtitle: 'Category limits, 50/30/20 rule, and envelope balances' },
      goals: { title: 'Savings Milestones', subtitle: 'Emergency reserve, vacation funds, and down payment progress' },
      debt: { title: 'Debt Payoff Simulator', subtitle: 'Snowball vs Avalanche comparison with APR interest savings' },
      insights: { title: 'Smart Financial Insights', subtitle: 'Pattern detection, budget variances, and savings opportunities' },
      settings: { title: 'Settings & Cloud Integration', subtitle: 'Supabase credentials, multi-currency, and backups' }
    };

    const currentMeta = tabMetadata[this.currentTab] || tabMetadata.overview;

    // 3. Render Header
    renderHeader(
      currentMeta.title,
      currentMeta.subtitle,
      state,
      store,
      () => {
        openAddTransactionModal(state, store, () => {
          this.showToast('Transaction added successfully!');
        });
      },
      () => {
        openCsvImportModal(state, store, (count) => {
          this.showToast(`Imported ${count} transactions from statement!`);
          this.navigateTo('transactions');
        });
      }
    );

    // 4. Render Active Module View
    if (!this.mainContentEl) return;

    switch (this.currentTab) {
      case 'overview':
        renderOverview(this.mainContentEl, state, store, (tabId) => this.navigateTo(tabId));
        break;
      case 'transactions':
        renderTransactions(
          this.mainContentEl,
          state,
          store,
          () => {
            openAddTransactionModal(state, store, () => {
              this.showToast('Transaction added successfully!');
            });
          },
          () => {
            openCsvImportModal(state, store, (count) => {
              this.showToast(`Imported ${count} transactions from statement!`);
            });
          }
        );
        break;
      case 'budgets':
        renderBudgets(this.mainContentEl, state, store);
        break;
      case 'goals':
        renderGoals(this.mainContentEl, state, store);
        break;
      case 'debt':
        renderDebt(this.mainContentEl, state, store);
        break;
      case 'insights':
        renderInsights(this.mainContentEl, state, store);
        break;
      case 'settings':
        renderSettings(this.mainContentEl, state, store);
        break;
      default:
        renderOverview(this.mainContentEl, state, store, (tabId) => this.navigateTo(tabId));
    }
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.appInstance = new App();
});
