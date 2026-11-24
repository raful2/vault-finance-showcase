/**
 * Full-page Authentication View (Login, Sign-Up, Demo Mode)
 */

import { AVATAR_COLORS } from '../../utils/authUtils.js';

export function renderAuthView(container, store) {
  let activeTab = 'signin'; // 'signin' or 'signup'
  let errorMessage = '';
  let selectedColor = AVATAR_COLORS[0];

  function render() {
    container.innerHTML = `
      <div class="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-surface-950 via-slate-900 to-surface-950">
        <div class="w-full max-w-md">
          <!-- Logo & Brand Header -->
          <div class="text-center mb-8">
            <div class="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 items-center justify-center shadow-xl shadow-sky-500/20 text-white mb-3">
              <i data-lucide="shield-check" class="w-8 h-8"></i>
            </div>
            <h1 class="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">VaultFinance</h1>
            <p class="text-xs text-slate-400 mt-1">Private, Multi-User Personal Finance OS</p>
          </div>

          <!-- Glass Card -->
          <div class="glass-card bg-surface-900/90 border border-slate-700/80 rounded-3xl p-7 shadow-2xl space-y-6">
            <!-- Tabs -->
            <div class="flex rounded-xl bg-slate-950/60 p-1 border border-slate-800">
              <button id="tab-signin" class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'signin'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }">Sign In</button>
              <button id="tab-signup" class="flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'signup'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }">Create Account</button>
            </div>

            <!-- Error Notification -->
            ${errorMessage ? `
              <div class="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <i data-lucide="alert-circle" class="w-4 h-4 shrink-0 text-rose-400"></i>
                <span>${errorMessage}</span>
              </div>
            ` : ''}

            <!-- Form -->
            <form id="auth-form" class="space-y-4">
              ${activeTab === 'signup' ? `
                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div class="relative">
                    <i data-lucide="user" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
                    <input type="text" id="auth-name" required placeholder="Alex Mercer"
                      class="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500">
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-semibold text-slate-300 mb-1.5">Avatar Color</label>
                  <div class="flex items-center gap-2">
                    ${AVATAR_COLORS.map(c => `
                      <button type="button" data-avatar-color="${c}" class="w-6 h-6 rounded-full transition-transform ${selectedColor === c ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'}" style="background-color: ${c}"></button>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                <div class="relative">
                  <i data-lucide="mail" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
                  <input type="email" id="auth-email" required placeholder="user@vaultfinance.app"
                    class="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500">
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <div class="relative">
                  <i data-lucide="lock" class="w-4 h-4 text-slate-500 absolute left-3 top-3"></i>
                  <input type="password" id="auth-password" required placeholder="••••••••" minlength="4"
                    class="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500">
                </div>
              </div>

              <button type="submit" id="btn-submit" class="w-full py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 transition flex items-center justify-center gap-2">
                <span>${activeTab === 'signin' ? 'Sign In to VaultFinance' : 'Create User Account'}</span>
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </button>
            </form>

            <!-- Divider -->
            <div class="relative flex py-2 items-center">
              <div class="flex-grow border-t border-slate-800"></div>
              <span class="flex-shrink mx-4 text-[11px] text-slate-500 uppercase font-semibold">Or</span>
              <div class="flex-grow border-t border-slate-800"></div>
            </div>

            <!-- Demo Mode Bypass -->
            <button id="btn-demo-mode" class="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-800/60 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-800 transition flex items-center justify-center gap-2">
              <i data-lucide="sparkles" class="w-4 h-4 text-amber-400"></i>
              <span>Explore Demo Mode (Read-Only Demo Data)</span>
            </button>
          </div>

          <!-- Footer notes -->
          <p class="text-center text-[11px] text-slate-500 mt-6">
            Private & End-to-End Encrypted in your browser • Zero data tracking
          </p>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ root: container });

    // Events
    container.querySelector('#tab-signin').addEventListener('click', () => {
      activeTab = 'signin';
      errorMessage = '';
      render();
    });

    container.querySelector('#tab-signup').addEventListener('click', () => {
      activeTab = 'signup';
      errorMessage = '';
      render();
    });

    container.querySelectorAll('button[data-avatar-color]').forEach(btn => {
      btn.addEventListener('click', () => {
        selectedColor = btn.getAttribute('data-avatar-color');
        render();
      });
    });

    container.querySelector('#btn-demo-mode').addEventListener('click', () => {
      store.enterDemoMode();
    });

    container.querySelector('#auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = container.querySelector('#auth-email').value.trim();
      const password = container.querySelector('#auth-password').value;

      if (activeTab === 'signin') {
        const result = await store.login(email, password);
        if (!result.ok) {
          errorMessage = result.error || 'Invalid email or password.';
          render();
        }
      } else {
        const name = container.querySelector('#auth-name').value.trim();
        const result = await store.signup(name, email, password, selectedColor);
        if (!result.ok) {
          errorMessage = result.error || 'Could not create account.';
          render();
        }
      }
    });
  }

  render();
}
