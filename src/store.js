/**
 * Central Reactive State Store for VaultFinance
 */

import { DEFAULT_STATE } from './mockData.js';
import { supabaseService } from './services/supabaseService.js';

const STORAGE_KEY = 'vault_finance_state_v1';

class Store {
  constructor() {
    this.listeners = new Set();
    this.state = this.loadInitialState();
    this.initCloud();
  }

  loadInitialState() {
    // 1. Check local storage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_STATE,
          ...parsed,
          settings: { ...DEFAULT_STATE.settings, ...parsed.settings },
          investments: parsed.investments || DEFAULT_STATE.investments || []
        };
      }
    } catch (e) {
      console.warn('Could not read from localStorage', e);
    }

    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  async initCloud() {
    // Attempt to load from local backend /api/state
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const serverState = await res.json();
        if (serverState && serverState.accounts) {
          this.state = {
            ...this.state,
            ...serverState,
            settings: { ...this.state.settings, ...serverState.settings }
          };
          this.notify();
        }
      }
    } catch {}

    // Init Supabase Service if keys are in settings
    if (this.state.settings.supabaseUrl && this.state.settings.supabaseKey) {
      supabaseService.url = this.state.settings.supabaseUrl;
      supabaseService.key = this.state.settings.supabaseKey;
    }
  }

  getState() {
    return this.state;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('localStorage save failed', e);
    }

    // Debounced persist to backend server
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(async () => {
      try {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.state)
        });
      } catch (err) {
        console.warn('Backend sync failed', err);
      }
    }, 400);

    // Notify all active listeners
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // --- ACTIONS ---

  // TRANSACTIONS
  addTransaction(tx) {
    const newTx = {
      ...tx,
      id: tx.id || `tx-${Date.now()}`
    };
    this.state.transactions = [newTx, ...this.state.transactions];

    // Update account balance
    const account = this.state.accounts.find(a => a.id === newTx.accountId);
    if (account) {
      account.balance = Number((Number(account.balance) + Number(newTx.amount)).toFixed(2));
    }

    this.notify();
  }

  deleteTransaction(id) {
    const tx = this.state.transactions.find(t => t.id === id);
    if (tx) {
      // Revert account balance
      const account = this.state.accounts.find(a => a.id === tx.accountId);
      if (account) {
        account.balance = Number((Number(account.balance) - Number(tx.amount)).toFixed(2));
      }
    }
    this.state.transactions = this.state.transactions.filter(t => t.id !== id);
    this.notify();
  }

  importTransactions(newTransactions, targetAccountId) {
    let balanceDelta = 0;
    newTransactions.forEach(tx => {
      balanceDelta += Number(tx.amount) || 0;
    });

    this.state.transactions = [...newTransactions, ...this.state.transactions];

    if (targetAccountId) {
      const account = this.state.accounts.find(a => a.id === targetAccountId);
      if (account) {
        account.balance = Number((Number(account.balance) + balanceDelta).toFixed(2));
      }
    }

    this.notify();
  }

  // ACCOUNTS
  addAccount(account) {
    const newAcc = {
      ...account,
      id: account.id || `acc-${Date.now()}`,
      balance: Number(account.balance) || 0
    };
    this.state.accounts.push(newAcc);
    this.notify();
  }

  editAccount(id, updates) {
    const idx = this.state.accounts.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.state.accounts[idx] = { ...this.state.accounts[idx], ...updates };
      this.notify();
    }
  }

  deleteAccount(id) {
    this.state.accounts = this.state.accounts.filter(a => a.id !== id);
    this.notify();
  }

  // BUDGETS
  updateBudget(id, updates) {
    const idx = this.state.budgets.findIndex(b => b.id === id);
    if (idx !== -1) {
      this.state.budgets[idx] = { ...this.state.budgets[idx], ...updates };
      this.notify();
    }
  }

  addBudget(budget) {
    this.state.budgets.push({
      ...budget,
      id: budget.id || `b-${Date.now()}`
    });
    this.notify();
  }

  deleteBudget(id) {
    this.state.budgets = this.state.budgets.filter(b => b.id !== id);
    this.notify();
  }

  // GOALS
  addGoal(goal) {
    this.state.goals.push({
      ...goal,
      id: goal.id || `g-${Date.now()}`,
      currentAmount: Number(goal.currentAmount) || 0,
      targetAmount: Number(goal.targetAmount) || 0
    });
    this.notify();
  }

  depositToGoal(goalId, amount, fromAccountId) {
    const goal = this.state.goals.find(g => g.id === goalId);
    if (!goal) return;

    const numAmount = Number(amount) || 0;
    goal.currentAmount = Number((Number(goal.currentAmount) + numAmount).toFixed(2));

    if (fromAccountId) {
      const acc = this.state.accounts.find(a => a.id === fromAccountId);
      if (acc) {
        acc.balance = Number((Number(acc.balance) - numAmount).toFixed(2));
      }

      // Record transaction
      this.addTransaction({
        date: new Date().toISOString().slice(0, 10),
        payee: `Savings Deposit: ${goal.title}`,
        category: 'Investment & Emergency',
        macroBucket: 'savings',
        amount: -numAmount,
        accountId: fromAccountId,
        notes: `Transfer to savings milestone: ${goal.title}`
      });
    } else {
      this.notify();
    }
  }

  deleteGoal(id) {
    this.state.goals = this.state.goals.filter(g => g.id !== id);
    this.notify();
  }

  // DEBTS
  addDebt(debt) {
    this.state.debts.push({
      ...debt,
      id: debt.id || `d-${Date.now()}`,
      balance: Number(debt.balance) || 0,
      interestRate: Number(debt.interestRate) || 0,
      minimumPayment: Number(debt.minimumPayment) || 0
    });
    this.notify();
  }

  updateDebt(id, updates) {
    const idx = this.state.debts.findIndex(d => d.id === id);
    if (idx !== -1) {
      this.state.debts[idx] = { ...this.state.debts[idx], ...updates };
      this.notify();
    }
  }

  deleteDebt(id) {
    this.state.debts = this.state.debts.filter(d => d.id !== id);
    this.notify();
  }

  // INVESTMENTS
  syncInvestmentAccountBalance() {
    if (!this.state.investments || !this.state.accounts) return;
    const totalInvested = this.state.investments.reduce((sum, h) => {
      const shares = Number(h.shares) || 0;
      const price = Number(h.currentPrice) || Number(h.costBasis) || 0;
      return sum + (shares * price);
    }, 0);

    const investmentAcc = this.state.accounts.find(a => a.type === 'investment' || a.id === 'acc-4');
    if (investmentAcc) {
      investmentAcc.balance = Number(totalInvested.toFixed(2));
    }
  }

  addHolding(holding) {
    if (!this.state.investments) this.state.investments = [];
    const newHolding = {
      ...holding,
      id: holding.id || `inv-${Date.now()}`,
      shares: Number(holding.shares) || 0,
      costBasis: Number(holding.costBasis) || 0,
      currentPrice: Number(holding.currentPrice) || Number(holding.costBasis) || 0,
      dividendYield: Number(holding.dividendYield) || 0,
      targetAllocationPct: Number(holding.targetAllocationPct) || 0
    };
    this.state.investments.push(newHolding);
    this.syncInvestmentAccountBalance();
    this.notify();
  }

  editHolding(id, updates) {
    if (!this.state.investments) return;
    const idx = this.state.investments.findIndex(h => h.id === id);
    if (idx !== -1) {
      this.state.investments[idx] = { ...this.state.investments[idx], ...updates };
      this.syncInvestmentAccountBalance();
      this.notify();
    }
  }

  deleteHolding(id) {
    if (!this.state.investments) return;
    this.state.investments = this.state.investments.filter(h => h.id !== id);
    this.syncInvestmentAccountBalance();
    this.notify();
  }

  importHoldings(newHoldings) {
    if (!this.state.investments) this.state.investments = [];
    newHoldings.forEach(h => {
      const existingIdx = this.state.investments.findIndex(item => item.symbol.toUpperCase() === h.symbol.toUpperCase());
      if (existingIdx !== -1) {
        this.state.investments[existingIdx] = { ...this.state.investments[existingIdx], ...h };
      } else {
        this.state.investments.push({
          ...h,
          id: h.id || `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
        });
      }
    });
    this.syncInvestmentAccountBalance();
    this.notify();
  }

  updateHoldingPrices(priceMap = {}) {
    if (!this.state.investments) return;
    let changed = false;
    this.state.investments.forEach(h => {
      const sym = h.symbol.toUpperCase();
      if (priceMap[sym] && priceMap[sym] !== h.currentPrice) {
        h.currentPrice = Number(priceMap[sym]);
        changed = true;
      }
    });
    if (changed) {
      this.syncInvestmentAccountBalance();
      this.notify();
    }
  }

  // SETTINGS
  updateSettings(partialSettings) {
    this.state.settings = { ...this.state.settings, ...partialSettings };
    if (partialSettings.supabaseUrl || partialSettings.supabaseKey) {
      supabaseService.url = this.state.settings.supabaseUrl;
      supabaseService.key = this.state.settings.supabaseKey;
    }
    this.notify();
  }

  togglePrivacyBlur() {
    this.updateSettings({ privacyBlur: !this.state.settings.privacyBlur });
  }

  setPrimaryCurrency(currency) {
    this.updateSettings({ primaryCurrency: currency });
  }

  setBudgetView(viewMode) {
    this.updateSettings({ activeBudgetView: viewMode });
  }

  resetToDemo() {
    this.state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    this.notify();
  }

  exportJson() {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(this.state, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `vault-finance-backup-${new Date().toISOString().slice(0, 10)}.json`);
    dlAnchor.click();
  }

  exportCsv() {
    const headers = ['ID', 'Date', 'Payee', 'Category', 'MacroBucket', 'Amount', 'Currency', 'Account', 'Notes'];
    const rows = this.state.transactions.map(t => {
      const acc = this.state.accounts.find(a => a.id === t.accountId);
      return [
        t.id,
        t.date,
        `"${(t.payee || '').replace(/"/g, '""')}"`,
        `"${t.category}"`,
        t.macroBucket,
        t.amount,
        t.currency || this.state.settings.primaryCurrency,
        `"${acc ? acc.name : ''}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURIComponent([headers.join(','), ...rows].join('\n'));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', csvContent);
    dlAnchor.setAttribute('download', `transactions-export-${new Date().toISOString().slice(0, 10)}.csv`);
    dlAnchor.click();
  }
}

export const store = new Store();
