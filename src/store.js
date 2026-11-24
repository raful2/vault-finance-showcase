/**
 * Central Reactive State Store for VaultFinance
 * Supports multi-user profiles, user sessions, data isolation, and split settings
 */

import { DEFAULT_STATE } from './mockData.js';
import { supabaseService } from './services/supabaseService.js';
import { hashPassword, generateId } from './utils/authUtils.js';

const AUTH_STORAGE_KEY = 'vault_finance_auth_v2';
const DEV_SETTINGS_KEY = 'vault_finance_dev_settings';
const LEGACY_KEY = 'vault_finance_state_v1';

class Store {
  constructor() {
    this.listeners = new Set();
    this.authStore = this.loadAuthStore();
    this.devSettings = this.loadDevSettings();
    this.state = this.loadInitialState();
    this.initCloud();
  }

  // --- PERSISTENCE & INITIALIZATION ---

  loadAuthStore() {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read auth store', e);
    }
    return {
      users: [],
      currentUserId: null,
      isDemo: false
    };
  }

  saveAuthStore() {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.authStore));
    } catch (e) {
      console.error('Failed to save auth store', e);
    }
  }

  loadDevSettings() {
    try {
      const stored = localStorage.getItem(DEV_SETTINGS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read dev settings', e);
    }
    return {
      supabaseUrl: '',
      supabaseKey: '',
      marketApiKey: '',
      debugMode: false
    };
  }

  saveDevSettings() {
    try {
      localStorage.setItem(DEV_SETTINGS_KEY, JSON.stringify(this.devSettings));
    } catch (e) {
      console.error('Failed to save dev settings', e);
    }
  }

  getUserStorageKey(userId) {
    return `vault_finance_user_${userId}`;
  }

  loadInitialState() {
    // Check if demo mode is active
    if (this.authStore.isDemo) {
      return {
        ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
        auth: {
          isAuthenticated: true,
          isDemo: true,
          currentUser: {
            id: 'demo-user',
            name: 'Demo Explorer',
            email: 'demo@vaultfinance.app',
            role: 'admin',
            avatarColor: '#3b82f6'
          },
          users: []
        },
        devSettings: this.devSettings
      };
    }

    // Check if user is logged in
    const currentUserId = this.authStore.currentUserId;
    const currentUser = this.authStore.users.find(u => u.id === currentUserId);

    if (currentUser) {
      let userFinanceState = null;
      try {
        const stored = localStorage.getItem(this.getUserStorageKey(currentUserId));
        if (stored) {
          userFinanceState = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Could not read user finance state', e);
      }

      // Legacy migration check: if no state, migrate from LEGACY_KEY
      if (!userFinanceState) {
        try {
          const legacy = localStorage.getItem(LEGACY_KEY);
          if (legacy) {
            userFinanceState = JSON.parse(legacy);
          }
        } catch {}
      }

      if (!userFinanceState) {
        userFinanceState = JSON.parse(JSON.stringify(DEFAULT_STATE));
      }

      return {
        ...DEFAULT_STATE,
        ...userFinanceState,
        settings: {
          ...DEFAULT_STATE.settings,
          ...(userFinanceState.settings || {})
        },
        auth: {
          isAuthenticated: true,
          isDemo: false,
          currentUser,
          users: this.authStore.users
        },
        devSettings: this.devSettings
      };
    }

    // No user logged in
    return {
      ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
      auth: {
        isAuthenticated: false,
        isDemo: false,
        currentUser: null,
        users: this.authStore.users
      },
      devSettings: this.devSettings
    };
  }

  async initCloud() {
    // If Supabase keys exist in devSettings, configure service
    if (this.devSettings.supabaseUrl && this.devSettings.supabaseKey) {
      supabaseService.url = this.devSettings.supabaseUrl;
      supabaseService.key = this.devSettings.supabaseKey;
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
    // Save current active user's financial state to isolated key
    if (this.state.auth.isAuthenticated && !this.state.auth.isDemo && this.state.auth.currentUser) {
      const storageKey = this.getUserStorageKey(this.state.auth.currentUser.id);
      try {
        const financeData = {
          accounts: this.state.accounts,
          transactions: this.state.transactions,
          budgets: this.state.budgets,
          investments: this.state.investments,
          goals: this.state.goals,
          debts: this.state.debts,
          settings: this.state.settings
        };
        localStorage.setItem(storageKey, JSON.stringify(financeData));
      } catch (e) {
        console.error('Failed to save user financial state', e);
      }
    }

    // Debounced persist to local server if available
    if (this._saveTimeout) clearTimeout(this._saveTimeout);
    this._saveTimeout = setTimeout(async () => {
      try {
        await fetch('/api/state', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.state)
        });
      } catch {}
    }, 400);

    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // --- AUTHENTICATION & MULTI-USER ACTIONS ---

  async signup(name, email, password, avatarColor = '#3b82f6') {
    const existing = this.authStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      return { ok: false, error: 'An account with this email already exists.' };
    }

    const passwordHash = await hashPassword(password);
    const isFirstUser = this.authStore.users.length === 0;

    const newUser = {
      id: generateId('u'),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: isFirstUser ? 'admin' : 'member',
      avatarColor: avatarColor || '#3b82f6',
      createdAt: new Date().toISOString()
    };

    this.authStore.users.push(newUser);
    this.authStore.currentUserId = newUser.id;
    this.authStore.isDemo = false;
    this.saveAuthStore();

    // Initialize user finance state with default mock data
    let initialUserFinance = JSON.parse(JSON.stringify(DEFAULT_STATE));

    // If first user, attempt to adopt legacy single-user data
    if (isFirstUser) {
      try {
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (parsed && parsed.accounts) {
            initialUserFinance = parsed;
          }
        }
      } catch {}
    }

    try {
      localStorage.setItem(this.getUserStorageKey(newUser.id), JSON.stringify(initialUserFinance));
    } catch {}

    this.state = {
      ...initialUserFinance,
      auth: {
        isAuthenticated: true,
        isDemo: false,
        currentUser: newUser,
        users: this.authStore.users
      },
      devSettings: this.devSettings
    };

    this.notify();
    return { ok: true, user: newUser };
  }

  async login(email, password) {
    const user = this.authStore.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { ok: false, error: 'User with this email not found.' };
    }

    const hash = await hashPassword(password);
    if (user.passwordHash !== hash) {
      return { ok: false, error: 'Incorrect password.' };
    }

    this.authStore.currentUserId = user.id;
    this.authStore.isDemo = false;
    this.saveAuthStore();

    this.state = this.loadInitialState();
    this.notify();
    return { ok: true, user };
  }

  logout() {
    this.authStore.currentUserId = null;
    this.authStore.isDemo = false;
    this.saveAuthStore();

    this.state = {
      ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
      auth: {
        isAuthenticated: false,
        isDemo: false,
        currentUser: null,
        users: this.authStore.users
      },
      devSettings: this.devSettings
    };

    this.notify();
  }

  enterDemoMode() {
    this.authStore.isDemo = true;
    this.authStore.currentUserId = null;
    this.saveAuthStore();

    this.state = {
      ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
      auth: {
        isAuthenticated: true,
        isDemo: true,
        currentUser: {
          id: 'demo-user',
          name: 'Demo Explorer',
          email: 'demo@vaultfinance.app',
          role: 'admin',
          avatarColor: '#3b82f6'
        },
        users: this.authStore.users
      },
      devSettings: this.devSettings
    };

    this.notify();
  }

  switchUser(userId) {
    const user = this.authStore.users.find(u => u.id === userId);
    if (!user) return false;

    this.authStore.currentUserId = user.id;
    this.authStore.isDemo = false;
    this.saveAuthStore();

    this.state = this.loadInitialState();
    this.notify();
    return true;
  }

  updateProfile(updates) {
    if (!this.state.auth.currentUser) return;
    const currentId = this.state.auth.currentUser.id;
    const userIdx = this.authStore.users.findIndex(u => u.id === currentId);

    if (userIdx !== -1) {
      this.authStore.users[userIdx] = { ...this.authStore.users[userIdx], ...updates };
      this.state.auth.currentUser = this.authStore.users[userIdx];
      this.state.auth.users = this.authStore.users;
      this.saveAuthStore();
      this.notify();
    }
  }

  async changePassword(oldPassword, newPassword) {
    if (!this.state.auth.currentUser) return { ok: false, error: 'Not authenticated' };
    const currentId = this.state.auth.currentUser.id;
    const user = this.authStore.users.find(u => u.id === currentId);
    if (!user) return { ok: false, error: 'User not found' };

    const oldHash = await hashPassword(oldPassword);
    if (user.passwordHash !== oldHash) {
      return { ok: false, error: 'Current password does not match.' };
    }

    user.passwordHash = await hashPassword(newPassword);
    this.saveAuthStore();
    return { ok: true };
  }

  promoteToAdmin(userId) {
    const user = this.authStore.users.find(u => u.id === userId);
    if (user) {
      user.role = 'admin';
      this.saveAuthStore();
      this.state.auth.users = this.authStore.users;
      this.notify();
    }
  }

  demoteToMember(userId) {
    const user = this.authStore.users.find(u => u.id === userId);
    if (user) {
      user.role = 'member';
      this.saveAuthStore();
      this.state.auth.users = this.authStore.users;
      this.notify();
    }
  }

  removeUser(userId) {
    // Can't remove yourself
    if (this.state.auth.currentUser && this.state.auth.currentUser.id === userId) {
      return false;
    }
    this.authStore.users = this.authStore.users.filter(u => u.id !== userId);
    try {
      localStorage.removeItem(this.getUserStorageKey(userId));
    } catch {}
    this.saveAuthStore();
    this.state.auth.users = this.authStore.users;
    this.notify();
    return true;
  }

  // --- DEVELOPER SETTINGS ---

  updateDevSettings(partial) {
    this.devSettings = { ...this.devSettings, ...partial };
    this.state.devSettings = this.devSettings;
    this.saveDevSettings();

    if (partial.supabaseUrl || partial.supabaseKey) {
      supabaseService.url = this.devSettings.supabaseUrl;
      supabaseService.key = this.devSettings.supabaseKey;
    }

    this.notify();
  }

  // --- FINANCIAL ACTIONS ---

  // TRANSACTIONS
  addTransaction(tx) {
    const newTx = {
      ...tx,
      id: tx.id || `tx-${Date.now()}`
    };
    this.state.transactions = [newTx, ...this.state.transactions];

    const account = this.state.accounts.find(a => a.id === newTx.accountId);
    if (account) {
      account.balance = Number((Number(account.balance) + Number(newTx.amount)).toFixed(2));
    }

    this.notify();
  }

  deleteTransaction(id) {
    const tx = this.state.transactions.find(t => t.id === id);
    if (tx) {
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
    this.state = {
      ...JSON.parse(JSON.stringify(DEFAULT_STATE)),
      auth: this.state.auth,
      devSettings: this.devSettings
    };
    this.notify();
  }

  exportJson() {
    const snapshot = {
      accounts: this.state.accounts,
      transactions: this.state.transactions,
      budgets: this.state.budgets,
      investments: this.state.investments,
      goals: this.state.goals,
      debts: this.state.debts,
      settings: this.state.settings,
      exportedAt: new Date().toISOString()
    };
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(snapshot, null, 2));
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
