/**
 * VaultFinance Main Application Coordinator
 * Handles modular routing, reactivity, authentication gate, and global modals
 */

import { store } from './store.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderHeader } from './components/Header.js';
import { renderOverview } from './modules/overview/OverviewView.js';
import { renderTransactions } from './modules/transactions/TransactionsView.js';
import { renderBudgets } from './modules/budgets/BudgetsView.js';
import { renderInvestments } from './modules/investments/InvestmentsView.js';
import { renderGoals } from './modules/goals/GoalsView.js';
import { renderDebt } from './modules/debt/DebtView.js';
import { renderInsights } from './modules/insights/InsightsView.js';
import { renderSettings } from './modules/settings/SettingsView.js';
import { renderAuthView } from './modules/auth/AuthView.js';
import { openAddTransactionModal } from './modules/transactions/AddTransactionModal.js';
import { openCsvImportModal } from './modules/transactions/CsvImportModal.js';

class App {
  constructor() {
    this.currentTab = 'overview';
    this.appEl = document.getElementById('app');
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
    if (state.settings?.privacyBlur) {
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

  renderAuthWall() {
    const sidebarEl = document.getElementById('sidebar-container');
    const headerEl = document.getElementById('header-container');
    const footerEl = document.querySelector('footer');

    if (sidebarEl) sidebarEl.classList.add('hidden');
    if (headerEl) headerEl.classList.add('hidden');
    if (footerEl) footerEl.classList.add('hidden');

    if (this.mainContentEl) {
      this.mainContentEl.className = 'w-full h-full p-0 m-0 max-w-none';
      renderAuthView(this.mainContentEl, store);
    }
  }

  render() {
    const state = store.getState();

    // Check Authentication Gate
    if (!state.auth?.isAuthenticated) {
      this.renderAuthWall();
      return;
    }

    // Restore Main Layout Visibility
    const sidebarEl = document.getElementById('sidebar-container');
    const headerEl = document.getElementById('header-container');
    const footerEl = document.querySelector('footer');

    if (sidebarEl) sidebarEl.classList.remove('hidden');
    if (headerEl) headerEl.classList.remove('hidden');
    if (footerEl) footerEl.classList.remove('hidden');

    if (this.mainContentEl) {
      this.mainContentEl.className = 'flex-1 p-6 max-w-7xl w-full mx-auto space-y-6';
    }

    // 1. Render Sidebar
    renderSidebar(this.currentTab, (tabId) => this.navigateTo(tabId), state, store);

    // 2. Titles per tab
    const tabMetadata = {
      overview: { title: 'Financial Overview', subtitle: 'Net worth, asset allocation, and cash flow trajectory' },
      transactions: { title: 'Transaction Ledger', subtitle: 'Search, filter, categorize, and bank statement uploads' },
      budgets: { title: 'Budgeting & Allocations', subtitle: 'Category limits, 50/30/20 rule, and envelope balances' },
      investments: { title: 'Investments & Portfolio', subtitle: 'Live ticker pricing, asset allocation rebalancing, and dividend forecasting' },
      goals: { title: 'Savings Milestones', subtitle: 'Emergency reserve, vacation funds, and down payment progress' },
      debt: { title: 'Debt Payoff Simulator', subtitle: 'Snowball vs Avalanche comparison with APR interest savings' },
      insights: { title: 'Smart Financial Insights', subtitle: 'Pattern detection, budget variances, and savings opportunities' },
      settings: { title: 'Settings & Administration', subtitle: 'User preferences, cloud integration, and developer configuration' }
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
      case 'investments':
        renderInvestments(this.mainContentEl, state, store);
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
