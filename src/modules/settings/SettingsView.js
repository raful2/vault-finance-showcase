/**
 * Settings, Supabase Cloud Configuration, Privacy and Backups View
 */

import { CURRENCY_SYMBOLS } from '../../utils/formatters.js';

export function renderSettings(container, state, store) {
  const { settings } = state;

  function render() {
    const isCloud = Boolean(settings.supabaseUrl && settings.supabaseKey);

    container.innerHTML = `
      <div class="space-y-6 max-w-4xl">
        
        <!-- Header -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 flex justify-between items-center">
          <div>
            <h3 class="font-bold text-slate-100 text-base">Settings & Cloud Architecture</h3>
            <p class="text-xs text-slate-400">Manage Supabase cloud connection, currency preferences, PIN protection, and full backups</p>
          </div>
          <span class="px-3 py-1 rounded-full text-xs font-semibold ${
            isCloud ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
          }">
            ${isCloud ? '🟢 Supabase Cloud Active' : '🟡 Offline / Demo Mode'}
          </span>
        </div>

        <!-- 1. Supabase Cloud Connection Box -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-5">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold">
                <i data-lucide="cloud" class="w-5 h-5"></i>
              </div>
              <div>
                <h4 class="font-bold text-slate-100 text-sm">Supabase PostgreSQL Cloud Integration</h4>
                <p class="text-xs text-slate-400">Sync accounts, transactions, and budgets across all your devices</p>
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
              <input type="url" id="input-supabase-url" placeholder="https://your-project.supabase.co" value="${settings.supabaseUrl || ''}"
                class="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono">
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Supabase Anon / Public API Key</label>
              <input type="password" id="input-supabase-key" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." value="${settings.supabaseKey || ''}"
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

        <!-- 2. Localization & Primary Currency -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
              <i data-lucide="globe" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Currency & Localization</h4>
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

        <!-- 3. Privacy, Masking & PIN Security -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <i data-lucide="shield" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Privacy & Security Suite</h4>
              <p class="text-xs text-slate-400">Mask dollar values in public or screen-sharing sessions</p>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <div class="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <div>
                <div class="font-semibold text-xs text-slate-200">Public Privacy Masking</div>
                <div class="text-[11px] text-slate-400">Blurs all dollar amounts on screen until toggled or hovered</div>
              </div>
              <button id="toggle-privacy-setting" class="px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                settings.privacyBlur ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
              }">
                ${settings.privacyBlur ? 'Enabled' : 'Disabled'}
              </button>
            </div>
          </div>
        </div>

        <!-- Market Data & Live Pricing -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
              <i data-lucide="trending-up" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Market Data & Portfolio Pricing</h4>
              <p class="text-xs text-slate-400">Live quotes use CoinGecko & free market endpoints by default. Add custom API keys for higher frequency.</p>
            </div>
          </div>

          <div class="space-y-3 pt-2">
            <div>
              <label class="block text-xs font-semibold text-slate-300 mb-1">Finnhub / AlphaVantage API Key (Optional)</label>
              <div class="flex gap-2">
                <input type="password" id="input-market-api-key" placeholder="Enter key (leave blank for free built-in quotes)" value="${settings.marketApiKey || ''}"
                  class="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono">
                <button id="btn-save-market-key" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700 transition">
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 4. Data Management, Export & Reset -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold">
              <i data-lucide="database" class="w-5 h-5"></i>
            </div>
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Data Backup & Migration</h4>
              <p class="text-xs text-slate-400">Export full database snapshots in JSON format or reset to sample demo data</p>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3 pt-2">
            <button id="btn-export-backup" class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition">
              <i data-lucide="download" class="w-4 h-4 text-sky-400"></i>
              <span>Download JSON Backup</span>
            </button>

            <label class="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition cursor-pointer">
              <i data-lucide="upload" class="w-4 h-4 text-indigo-400"></i>
              <span>Restore JSON Backup</span>
              <input type="file" id="input-restore-backup" accept=".json" class="hidden">
            </label>

            <button id="btn-reset-demo" class="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 flex items-center gap-2 transition ml-auto">
              <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
              <span>Reset to Demo Data</span>
            </button>
          </div>
        </div>

      </div>
    `;

    // Attach Handlers
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
                store.state = parsed;
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

    const saveMarketBtn = container.querySelector('#btn-save-market-key');
    if (saveMarketBtn) {
      saveMarketBtn.addEventListener('click', () => {
        const key = container.querySelector('#input-market-api-key').value.trim();
        store.updateSettings({ marketApiKey: key });
        alert('Market Data API Key saved!');
      });
    }

    const resetDemoBtn = container.querySelector('#btn-reset-demo');
    if (resetDemoBtn) {
      resetDemoBtn.addEventListener('click', () => {
        if (confirm('Reset all financial accounts, transactions, and budgets back to sample demonstration data?')) {
          store.resetToDemo();
          alert('State has been reset to default demo data.');
          render();
        }
      });
    }

    // Supabase handlers
    const testBtn = container.querySelector('#btn-test-supabase');
    const saveSupabaseBtn = container.querySelector('#btn-save-supabase');
    const statusMsg = container.querySelector('#supabase-status-message');

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

    saveSupabaseBtn.addEventListener('click', () => {
      const url = container.querySelector('#input-supabase-url').value.trim();
      const key = container.querySelector('#input-supabase-key').value.trim();
      store.updateSettings({ supabaseUrl: url, supabaseKey: key });
      alert('Supabase credentials saved successfully!');
      render();
    });

    if (window.lucide) {
      window.lucide.createIcons({ root: container });
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
