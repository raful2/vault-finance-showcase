/**
 * Settings View: Separated into "User Settings" and "Developer Settings" (Admin only)
 */

import { CURRENCY_SYMBOLS } from '../../utils/formatters.js';
import { AVATAR_COLORS } from '../../utils/authUtils.js';

export function renderSettings(container, state, store) {
  const { settings, auth, devSettings } = state;
  const isAdmin = auth?.currentUser?.role === 'admin' || auth?.isDemo;
  let activeTab = 'user'; // 'user' or 'dev'

  function render() {
    const isCloud = Boolean(devSettings?.supabaseUrl && devSettings?.supabaseKey);
    const currentUser = auth?.currentUser || { name: 'User', email: 'user@vaultfinance.app', role: 'member' };
    const allUsers = auth?.users || [];

    container.innerHTML = `
      <div class="space-y-6 max-w-4xl">
        
        <!-- Header with Sub-tabs -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 class="font-bold text-slate-100 text-base">Settings & System Preferences</h3>
            <p class="text-xs text-slate-400">Configure your profile, display preferences, and technical integrations</p>
          </div>
          
          <!-- Tab Selector -->
          <div class="flex rounded-xl bg-slate-950/80 p-1 border border-slate-800">
            <button id="tab-btn-user" class="px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'user'
                ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            } flex items-center gap-1.5">
              <i data-lucide="user" class="w-3.5 h-3.5"></i>
              <span>User Settings</span>
            </button>

            ${isAdmin ? `
              <button id="tab-btn-dev" class="px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'dev'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              } flex items-center gap-1.5">
                <i data-lucide="code-2" class="w-3.5 h-3.5"></i>
                <span>Developer Settings</span>
                <span class="px-1 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">ADMIN</span>
              </button>
            ` : ''}
          </div>
        </div>

        ${activeTab === 'user' ? renderUserSettings() : renderDeveloperSettings()}

      </div>
    `;

    attachHandlers();

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
    }
  }

  function renderUserSettings() {
    const currentUser = auth?.currentUser || { name: 'User', email: 'user@vaultfinance.app', role: 'member', avatarColor: '#3b82f6' };

    return `
      <div class="space-y-6 animate-fade-in">
        <!-- 1. User Profile -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm" style="background-color: ${currentUser.avatarColor || '#3b82f6'}">
              ${currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Profile Details</h4>
              <p class="text-xs text-slate-400">Your account info and household role</p>
            </div>
            <span class="ml-auto px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              currentUser.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
            }">
              ${currentUser.role || 'Member'}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Display Name</label>
              <input type="text" id="input-profile-name" value="${currentUser.name || ''}"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
              <input type="email" id="input-profile-email" value="${currentUser.email || ''}"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
            </div>
          </div>

          <div class="flex items-center gap-2 pt-1">
            <span class="text-xs text-slate-400 mr-2">Avatar Color:</span>
            ${AVATAR_COLORS.map(c => `
              <button type="button" data-select-color="${c}" class="w-5 h-5 rounded-full transition-transform ${currentUser.avatarColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}" style="background-color: ${c}"></button>
            `).join('')}
          </div>

          <div class="pt-2">
            <button id="btn-save-profile" class="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition">
              Save Profile Changes
            </button>
          </div>
        </div>

        <!-- 2. Change Password -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
              <i data-lucide="key" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Security & Password</h4>
              <p class="text-xs text-slate-400">Update your account login password</p>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Current Password</label>
              <input type="password" id="input-old-pass" placeholder="••••••••"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">New Password</label>
              <input type="password" id="input-new-pass" placeholder="••••••••"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500">
            </div>
          </div>

          <div id="password-status-msg" class="hidden text-xs p-3 rounded-xl"></div>

          <div class="pt-1">
            <button id="btn-change-password" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition">
              Update Password
            </button>
          </div>
        </div>

        <!-- 3. Localization & Primary Currency -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
              <i data-lucide="globe" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Currency & Display</h4>
              <p class="text-xs text-slate-400">Set the default primary base currency for your portfolio and budgets</p>
            </div>
          </div>

          <div class="pt-2">
            <label class="block text-xs font-semibold text-slate-300 mb-1">Primary Display Currency</label>
            <select id="setting-currency-select" class="w-full sm:w-64 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-sky-500 focus:outline-none">
              ${Object.keys(CURRENCY_SYMBOLS).map(curr => `
                <option value="${curr}" ${curr === settings.primaryCurrency ? 'selected' : ''}>
                  ${CURRENCY_SYMBOLS[curr]} ${curr} - ${getCurrencyName(curr)}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <!-- 4. Privacy & Masking -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <i data-lucide="shield" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Privacy Suite</h4>
              <p class="text-xs text-slate-400">Mask dollar values in public or screen-sharing sessions</p>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <div class="font-semibold text-xs text-slate-200">Public Privacy Masking</div>
                <div class="text-[11px] text-slate-400">Blurs all dollar amounts on screen until hovered</div>
              </div>
              <button id="toggle-privacy-setting" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                settings.privacyBlur ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }">
                ${settings.privacyBlur ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        <!-- 5. Data Export -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
              <i data-lucide="download" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Data Export</h4>
              <p class="text-xs text-slate-400">Export your accounts, transactions, and budgets snapshot</p>
            </div>
          </div>

          <div class="flex items-center gap-3 pt-2">
            <button id="btn-export-backup" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition">
              <i data-lucide="file-json" class="w-4 h-4 text-sky-400"></i>
              <span>Download JSON Backup</span>
            </button>
            <button id="btn-export-csv" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition">
              <i data-lucide="file-spreadsheet" class="w-4 h-4 text-emerald-400"></i>
              <span>Export Ledger to CSV</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }

  function renderDeveloperSettings() {
    const isCloud = Boolean(devSettings?.supabaseUrl && devSettings?.supabaseKey);
    const allUsers = auth?.users || [];
    const currentUserId = auth?.currentUser?.id;

    return `
      <div class="space-y-6 animate-fade-in">
        <!-- Developer Warning Banner -->
        <div class="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-200">
          <i data-lucide="alert-triangle" class="w-5 h-5 shrink-0 text-amber-400"></i>
          <div class="text-xs">
            <span class="font-bold">Developer & Administration Area:</span> Changes here affect cloud database synchronization, market data APIs, and user roles across the app.
          </div>
        </div>

        <!-- 1. Household User Management -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center justify-center font-bold">
                <i data-lucide="users" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-slate-100 text-sm">User & Household Management</h4>
                <p class="text-xs text-slate-400">Manage user accounts and role permissions</p>
              </div>
            </div>
            <span class="text-xs text-slate-400">${allUsers.length} total users</span>
          </div>

          <div class="divide-y divide-slate-800/80 pt-2">
            ${allUsers.map(u => `
              <div class="py-3 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white" style="background-color: ${u.avatarColor || '#3b82f6'}">
                    ${u.name ? u.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div class="text-xs font-semibold text-slate-200 flex items-center gap-2">
                      <span>${u.name}</span>
                      ${u.id === currentUserId ? `<span class="text-[10px] text-sky-400 font-normal">(You)</span>` : ''}
                    </div>
                    <div class="text-[11px] text-slate-400">${u.email}</div>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    u.role === 'admin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-slate-800 text-slate-400'
                  }">
                    ${u.role}
                  </span>

                  ${u.id !== currentUserId ? `
                    <button data-switch-to="${u.id}" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition">
                      Switch
                    </button>
                    ${u.role === 'member' ? `
                      <button data-promote-user="${u.id}" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition">
                        Make Admin
                      </button>
                    ` : `
                      <button data-demote-user="${u.id}" class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-400 hover:bg-slate-700 transition">
                        Demote
                      </button>
                    `}
                    <button data-remove-user="${u.id}" class="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20 transition">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 2. Supabase Cloud Connection Box -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <i data-lucide="cloud" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-slate-100 text-sm">Supabase PostgreSQL Integration</h4>
                <p class="text-xs text-slate-400">Sync accounts, transactions, and budgets with cloud Postgres</p>
              </div>
            </div>
            
            <a href="/supabase-schema.sql" download="supabase-schema.sql" class="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-1.5 transition">
              <i data-lucide="file-code" class="w-3.5 h-3.5 text-sky-400"></i>
              <span>Download SQL Schema</span>
            </a>
          </div>

          <div class="space-y-4 pt-2">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Supabase Project URL</label>
              <input type="url" id="input-supabase-url" placeholder="https://your-project.supabase.co" value="${devSettings?.supabaseUrl || ''}"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Supabase Anon / Public API Key</label>
              <input type="password" id="input-supabase-key" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." value="${devSettings?.supabaseKey || ''}"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono">
            </div>

            <div id="supabase-status-message" class="hidden text-xs p-3 rounded-xl"></div>

            <div class="flex items-center gap-3 pt-2">
              <button id="btn-test-supabase" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white transition flex items-center gap-2">
                <i data-lucide="activity" class="w-4 h-4 text-emerald-400"></i>
                <span>Test Connection</span>
              </button>
              <button id="btn-save-supabase" class="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-500 transition">
                Save & Connect
              </button>
            </div>
          </div>
        </div>

        <!-- 3. Market Data & Pricing Engine -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
              <i data-lucide="trending-up" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Market Data API Key</h4>
              <p class="text-xs text-slate-400">Optional custom key for Finnhub or AlphaVantage equity price refreshes</p>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">API Key</label>
              <div class="flex gap-2">
                <input type="password" id="input-market-api-key" placeholder="Enter key (leave blank for free built-in quotes)" value="${devSettings?.marketApiKey || ''}"
                  class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono">
                <button id="btn-save-market-key" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 transition">
                  Save Key
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. System Backup, Restore & Reset -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
              <i data-lucide="database" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">System Database Maintenance</h4>
              <p class="text-xs text-slate-400">Restore backups or reset current user back to clean demonstration seeds</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <label class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition cursor-pointer">
              <i data-lucide="upload" class="w-4 h-4 text-indigo-400"></i>
              <span>Restore JSON Backup</span>
              <input type="file" id="input-restore-backup" accept=".json" class="hidden">
            </label>

            <button id="btn-reset-demo" class="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 flex items-center gap-2 transition ml-auto">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
              <span>Reset User to Demo Seeds</span>
            </button>
          </div>
        </div>

      </div>
    `;
  }

  function attachHandlers() {
    const tabUser = container.querySelector('#tab-btn-user');
    const tabDev = container.querySelector('#tab-btn-dev');

    if (tabUser) {
      tabUser.addEventListener('click', () => {
        activeTab = 'user';
        render();
      });
    }

    if (tabDev) {
      tabDev.addEventListener('click', () => {
        activeTab = 'dev';
        render();
      });
    }

    if (activeTab === 'user') {
      attachUserHandlers();
    } else {
      attachDevHandlers();
    }
  }

  function attachUserHandlers() {
    let chosenColor = auth?.currentUser?.avatarColor || '#3b82f6';

    container.querySelectorAll('button[data-select-color]').forEach(btn => {
      btn.addEventListener('click', () => {
        chosenColor = btn.getAttribute('data-select-color');
        container.querySelectorAll('button[data-select-color]').forEach(b => {
          b.classList.remove('ring-2', 'ring-white', 'scale-110');
          b.classList.add('opacity-70');
        });
        btn.classList.add('ring-2', 'ring-white', 'scale-110');
        btn.classList.remove('opacity-70');
      });
    });

    const saveProfileBtn = container.querySelector('#btn-save-profile');
    if (saveProfileBtn) {
      saveProfileBtn.addEventListener('click', () => {
        const name = container.querySelector('#input-profile-name').value.trim();
        const email = container.querySelector('#input-profile-email').value.trim();
        store.updateProfile({ name, email, avatarColor: chosenColor });
        alert('Profile updated successfully!');
      });
    }

    const changePassBtn = container.querySelector('#btn-change-password');
    if (changePassBtn) {
      changePassBtn.addEventListener('click', async () => {
        const oldP = container.querySelector('#input-old-pass').value;
        const newP = container.querySelector('#input-new-pass').value;
        const msg = container.querySelector('#password-status-msg');

        if (!oldP || !newP) {
          msg.className = 'text-xs p-3 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 block';
          msg.textContent = 'Please fill out both current and new password.';
          return;
        }

        const res = await store.changePassword(oldP, newP);
        if (res.ok) {
          msg.className = 'text-xs p-3 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 block';
          msg.textContent = 'Password updated successfully!';
          container.querySelector('#input-old-pass').value = '';
          container.querySelector('#input-new-pass').value = '';
        } else {
          msg.className = 'text-xs p-3 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 block';
          msg.textContent = res.error || 'Password update failed.';
        }
      });
    }

    const currencySelect = container.querySelector('#setting-currency-select');
    if (currencySelect) {
      currencySelect.addEventListener('change', (e) => {
        store.setPrimaryCurrency(e.target.value);
      });
    }

    const privacyToggle = container.querySelector('#toggle-privacy-setting');
    if (privacyToggle) {
      privacyToggle.addEventListener('click', () => {
        store.togglePrivacyBlur();
        render();
      });
    }

    const exportBackupBtn = container.querySelector('#btn-export-backup');
    if (exportBackupBtn) {
      exportBackupBtn.addEventListener('click', () => store.exportJson());
    }

    const exportCsvBtn = container.querySelector('#btn-export-csv');
    if (exportCsvBtn) {
      exportCsvBtn.addEventListener('click', () => store.exportCsv());
    }
  }

  function attachDevHandlers() {
    // User management buttons
    container.querySelectorAll('button[data-switch-to]').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-switch-to');
        store.switchUser(uid);
      });
    });

    container.querySelectorAll('button[data-promote-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-promote-user');
        store.promoteToAdmin(uid);
        render();
      });
    });

    container.querySelectorAll('button[data-demote-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-demote-user');
        store.demoteToMember(uid);
        render();
      });
    });

    container.querySelectorAll('button[data-remove-user]').forEach(btn => {
      btn.addEventListener('click', () => {
        const uid = btn.getAttribute('data-remove-user');
        if (confirm('Are you sure you want to delete this user and all their financial data?')) {
          store.removeUser(uid);
          render();
        }
      });
    });

    // Supabase
    const testBtn = container.querySelector('#btn-test-supabase');
    const saveSupabaseBtn = container.querySelector('#btn-save-supabase');
    const statusMsg = container.querySelector('#supabase-status-message');

    if (testBtn) {
      testBtn.addEventListener('click', async () => {
        const url = container.querySelector('#input-supabase-url').value.trim();
        const key = container.querySelector('#input-supabase-key').value.trim();

        statusMsg.className = 'text-xs p-3 rounded-xl bg-sky-500/10 text-sky-300 border border-sky-500/20 block';
        statusMsg.textContent = 'Testing connection to Supabase...';

        try {
          const res = await fetch('/api/supabase/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, key })
          });
          const result = await res.json();
          if (result.connected) {
            statusMsg.className = 'text-xs p-3 rounded-xl bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 block';
            statusMsg.textContent = '✓ ' + (result.message || 'Supabase connected successfully!');
          } else {
            statusMsg.className = 'text-xs p-3 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 block';
            statusMsg.textContent = '✗ ' + (result.message || 'Could not verify connection.');
          }
        } catch (err) {
          statusMsg.className = 'text-xs p-3 rounded-xl bg-rose-500/10 text-rose-300 border border-rose-500/20 block';
          statusMsg.textContent = '✗ Network test error: ' + err.message;
        }
      });
    }

    if (saveSupabaseBtn) {
      saveSupabaseBtn.addEventListener('click', () => {
        const url = container.querySelector('#input-supabase-url').value.trim();
        const key = container.querySelector('#input-supabase-key').value.trim();
        store.updateDevSettings({ supabaseUrl: url, supabaseKey: key });
        alert('Supabase credentials saved successfully in Developer Settings!');
        render();
      });
    }

    // Market API key
    const saveMarketBtn = container.querySelector('#btn-save-market-key');
    if (saveMarketBtn) {
      saveMarketBtn.addEventListener('click', () => {
        const key = container.querySelector('#input-market-api-key').value.trim();
        store.updateDevSettings({ marketApiKey: key });
        alert('Market Data API Key saved in Developer Settings!');
      });
    }

    // Restore Backup
    const restoreInput = container.querySelector('#input-restore-backup');
    if (restoreInput) {
      restoreInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = (evt) => {
            try {
              const parsed = JSON.parse(evt.target.result);
              if (parsed.accounts && parsed.transactions) {
                store.state = { ...store.state, ...parsed };
                store.notify();
                alert('Backup restored successfully!');
                render();
              } else {
                alert('Invalid backup file format');
              }
            } catch (err) {
              alert('Could not parse backup file: ' + err.message);
            }
          };
          reader.readAsText(file);
        }
      });
    }

    // Reset Demo
    const resetDemoBtn = container.querySelector('#btn-reset-demo');
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener('click', () => {
        if (confirm('Reset your accounts and transactions back to default demo seeds?')) {
          store.resetToDemo();
          alert('Current user has been reset to default seeds.');
          render();
        }
      });
    }
  }

  function getCurrencyName(code) {
    const names = {
      USD: 'US Dollar',
      EUR: 'Euro',
      GBP: 'British Pound',
      CAD: 'Canadian Dollar',
      AUD: 'Australian Dollar',
      JPY: 'Japanese Yen',
      CHF: 'Swiss Franc'
    };
    return names[code] || code;
  }

  render();
}
