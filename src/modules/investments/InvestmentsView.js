/**
 * Investments & Asset Portfolio Deep-Dive Module View
 */

import { analyzePortfolio, ASSET_CLASS_LABELS, ASSET_CLASS_COLORS } from '../../utils/investmentCalculator.js';
import { formatCurrency, formatPercent } from '../../utils/formatters.js';
import { marketDataService } from '../../services/marketDataService.js';
import { openAddHoldingModal } from './AddHoldingModal.js';
import { openCsvHoldingImportModal } from './CsvHoldingImportModal.js';

let chartInstanceActual = null;
let chartInstanceTarget = null;
let chartInstanceDividends = null;

export function renderInvestments(container, state, store) {
  const currency = state.settings.primaryCurrency || 'USD';
  const isPrivacy = state.settings.privacyBlur;
  let activeTab = 'holdings'; // 'holdings', 'rebalance', 'dividends', 'performance'
  let searchQuery = '';
  let selectedClassFilter = 'all';
  let isRefreshingPrices = false;

  function render() {
    const portfolio = analyzePortfolio(state.investments || []);

    container.innerHTML = `
      <div class="space-y-6">
        
        <!-- Top Portfolio Summary Header -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div class="glass-card p-5 rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 to-indigo-950/30">
            <span class="text-xs text-slate-400 font-medium">Total Portfolio Value</span>
            <div class="text-2xl font-extrabold text-white mt-1 privacy-value">
              ${formatCurrency(portfolio.totalValue, currency, isPrivacy)}
            </div>
            <div class="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
              <span>Cost Basis: <strong class="text-slate-300 privacy-value">${formatCurrency(portfolio.totalCost, currency, isPrivacy)}</strong></span>
            </div>
          </div>

          <div class="glass-card p-5 rounded-2xl border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Unrealized Gain / Loss</span>
            <div class="text-2xl font-extrabold ${portfolio.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-1 privacy-value">
              ${portfolio.totalGainLoss >= 0 ? '+' : ''}${formatCurrency(portfolio.totalGainLoss, currency, isPrivacy)}
            </div>
            <div class="text-[11px] font-semibold ${portfolio.totalGainLoss >= 0 ? 'text-emerald-400' : 'text-rose-400'} mt-1">
              ${portfolio.totalGainLoss >= 0 ? '▲' : '▼'} ${formatPercent(portfolio.totalGainLossPct)} Total Return
            </div>
          </div>

          <div class="glass-card p-5 rounded-2xl border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Annual Dividend Income</span>
            <div class="text-2xl font-extrabold text-sky-400 mt-1 privacy-value">
              ${formatCurrency(portfolio.annualDividendTotal, currency, isPrivacy)}
            </div>
            <div class="text-[11px] text-slate-400 mt-1">
              <span>Avg Portfolio Yield: <strong class="text-sky-300">${formatPercent(portfolio.portfolioYieldPct)}</strong></span>
            </div>
          </div>

          <div class="glass-card p-5 rounded-2xl border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Portfolio Composition</span>
            <div class="text-2xl font-extrabold text-indigo-400 mt-1">
              ${portfolio.holdingsCount} <span class="text-sm font-normal text-slate-400">Assets</span>
            </div>
            <div class="text-[11px] text-slate-400 mt-1">
              <span>Across ${portfolio.classBreakdown.length} asset classes</span>
            </div>
          </div>

        </div>

        <!-- Sub-View Navigation Toolbar -->
        <div class="glass-card p-4 rounded-2xl border border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          
          <!-- View Toggle Buttons -->
          <div class="flex flex-wrap items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs w-full xl:w-auto">
            <button data-inv-tab="holdings" class="px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === 'holdings' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }">
              Holdings & Quotes
            </button>
            <button data-inv-tab="rebalance" class="px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === 'rebalance' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }">
              Allocation & Rebalance
            </button>
            <button data-inv-tab="dividends" class="px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === 'dividends' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }">
              Dividend Forecaster
            </button>
            <button data-inv-tab="performance" class="px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              activeTab === 'performance' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }">
              Performance Analytics
            </button>
          </div>

          <!-- Actions Toolbar -->
          <div class="flex flex-wrap items-center gap-2.5 w-full xl:w-auto justify-start xl:justify-end">
            <button id="btn-refresh-quotes" title="Refresh Live Prices" class="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 flex items-center gap-1.5 transition">
              <i data-lucide="refresh-cw" class="w-3.5 h-3.5 text-sky-400 ${isRefreshingPrices ? 'animate-spin' : ''}"></i>
              <span class="hidden sm:inline">Refresh Prices</span>
            </button>

            <button id="btn-import-holdings-csv" class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white flex items-center gap-2 transition">
              <i data-lucide="upload-cloud" class="w-4 h-4 text-indigo-400"></i>
              <span>Import Brokerage CSV</span>
            </button>

            <button id="btn-add-asset" class="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-indigo-500 flex items-center gap-1.5 transition">
              <i data-lucide="plus" class="w-4 h-4"></i>
              <span>Add Asset</span>
            </button>
          </div>

        </div>

        <!-- SUBVIEW CONTENT CONTAINER -->
        <div id="inv-subview-container"></div>

      </div>
    `;

    const subContainer = container.querySelector('#inv-subview-container');
    if (activeTab === 'holdings') {
      renderHoldingsTab(subContainer, portfolio, state, store, currency, isPrivacy);
    } else if (activeTab === 'rebalance') {
      renderRebalanceTab(subContainer, portfolio, state, store, currency, isPrivacy);
    } else if (activeTab === 'dividends') {
      renderDividendsTab(subContainer, portfolio, state, store, currency, isPrivacy);
    } else if (activeTab === 'performance') {
      renderPerformanceTab(subContainer, portfolio, state, store, currency, isPrivacy);
    }

    // Attach Tab Navigation Handlers
    container.querySelectorAll('button[data-inv-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        activeTab = btn.getAttribute('data-inv-tab');
        render();
      });
    });

    // Refresh quotes handler
    const refreshBtn = container.querySelector('#btn-refresh-quotes');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        isRefreshingPrices = true;
        render();
        try {
          const prices = await marketDataService.updateAllHoldingsPrices(state.investments, state.settings.marketApiKey);
          store.updateHoldingPrices(prices);
        } finally {
          isRefreshingPrices = false;
          render();
        }
      });
    }

    // Add Asset Modal
    const addAssetBtn = container.querySelector('#btn-add-asset');
    if (addAssetBtn) {
      addAssetBtn.addEventListener('click', () => {
        openAddHoldingModal(state, store, null, () => render());
      });
    }

    // Import Holdings CSV Modal
    const importCsvBtn = container.querySelector('#btn-import-holdings-csv');
    if (importCsvBtn) {
      importCsvBtn.addEventListener('click', () => {
        openCsvHoldingImportModal(state, store, () => render());
      });
    }

    if (window.lucide) window.lucide.createIcons({ root: container });
  }

  // --- SUBVIEW 1: Holdings & Live Quotes Table ---
  function renderHoldingsTab(target, portfolio, state, store, currency, isPrivacy) {
    const filteredHoldings = portfolio.holdings.filter(h => {
      if (selectedClassFilter !== 'all' && h.assetClass !== selectedClassFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return h.symbol.toLowerCase().includes(q) || h.name.toLowerCase().includes(q);
      }
      return true;
    });

    target.innerHTML = `
      <div class="space-y-4">
        
        <!-- Filter Toolbar -->
        <div class="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <!-- Search -->
          <div class="relative sm:w-64">
            <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"></i>
            <input type="text" id="inv-search-input" placeholder="Search symbol or name..." value="${searchQuery}"
              class="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500">
          </div>

          <!-- Class Filter Pills -->
          <div class="flex items-center gap-1 text-xs">
            ${[
              { id: 'all', label: 'All' },
              { id: 'etf', label: 'ETFs' },
              { id: 'stock', label: 'Stocks' },
              { id: 'crypto', label: 'Crypto' },
              { id: 'bond', label: 'Bonds' }
            ].map(f => `
              <button data-hold-filter="${f.id}" class="px-2.5 py-1 rounded-lg font-medium transition ${
                selectedClassFilter === f.id ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'
              }">
                ${f.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Table -->
        <div class="glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs text-slate-300">
              <thead class="bg-slate-900/80 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th class="py-3 px-4">Asset</th>
                  <th class="py-3 px-4 text-right">Shares</th>
                  <th class="py-3 px-4 text-right">Cost Basis</th>
                  <th class="py-3 px-4 text-right">Live Price</th>
                  <th class="py-3 px-4 text-right">Total Value</th>
                  <th class="py-3 px-4 text-right">Unrealized P&L</th>
                  <th class="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800/60">
                ${filteredHoldings.length === 0 ? `
                  <tr>
                    <td colspan="7" class="py-12 text-center text-slate-500">
                      <p class="font-medium">No investment holdings found</p>
                      <p class="text-[11px] mt-1">Click "Add Asset" or "Import Brokerage CSV" to add securities.</p>
                    </td>
                  </tr>
                ` : filteredHoldings.map(h => {
                  const isPositive = h.gainLoss >= 0;
                  return `
                    <tr class="hover:bg-slate-800/40 transition group">
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs" style="background-color: ${ASSET_CLASS_COLORS[h.assetClass] || '#3b82f6'}20; color: ${ASSET_CLASS_COLORS[h.assetClass] || '#3b82f6'}; border: 1px solid ${ASSET_CLASS_COLORS[h.assetClass] || '#3b82f6'}40">
                            ${h.symbol.slice(0, 4)}
                          </div>
                          <div>
                            <div class="font-bold text-slate-100 flex items-center gap-2">
                              <span>${h.symbol}</span>
                              <span class="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-800 text-slate-400 uppercase">
                                ${h.assetClass}
                              </span>
                            </div>
                            <div class="text-[11px] text-slate-400 truncate max-w-xs">${h.name}</div>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-right font-mono font-medium text-slate-200">
                        ${h.shares}
                      </td>
                      <td class="py-3.5 px-4 text-right font-mono text-slate-400 privacy-value">
                        ${formatCurrency(h.costBasis, currency, isPrivacy)}
                      </td>
                      <td class="py-3.5 px-4 text-right font-mono font-bold text-slate-100 privacy-value">
                        ${formatCurrency(h.currentPrice, currency, isPrivacy)}
                      </td>
                      <td class="py-3.5 px-4 text-right font-mono font-extrabold text-slate-100 text-sm privacy-value">
                        ${formatCurrency(h.value, currency, isPrivacy)}
                      </td>
                      <td class="py-3.5 px-4 text-right whitespace-nowrap">
                        <div class="font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'} privacy-value">
                          ${isPositive ? '+' : ''}${formatCurrency(h.gainLoss, currency, isPrivacy)}
                        </div>
                        <div class="text-[10px] font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}">
                          ${isPositive ? '▲' : '▼'} ${formatPercent(h.gainLossPct)}
                        </div>
                      </td>
                      <td class="py-3.5 px-4 text-center whitespace-nowrap">
                        <div class="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          <button data-edit-hold="${h.id}" title="Edit asset" class="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-slate-800 transition">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                          </button>
                          <button data-delete-hold="${h.id}" title="Delete asset" class="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    // Filter Listeners
    const searchEl = target.querySelector('#inv-search-input');
    if (searchEl) {
      searchEl.addEventListener('input', e => {
        searchQuery = e.target.value;
        renderHoldingsTab(target, portfolio, state, store, currency, isPrivacy);
      });
    }

    target.querySelectorAll('button[data-hold-filter]').forEach(b => {
      b.addEventListener('click', () => {
        selectedClassFilter = b.getAttribute('data-hold-filter');
        renderHoldingsTab(target, portfolio, state, store, currency, isPrivacy);
      });
    });

    target.querySelectorAll('button[data-edit-hold]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-edit-hold');
        const hold = state.investments.find(h => h.id === id);
        if (hold) openAddHoldingModal(state, store, hold, () => render());
      });
    });

    target.querySelectorAll('button[data-delete-hold]').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-delete-hold');
        if (confirm('Delete this holding from portfolio?')) {
          store.deleteHolding(id);
          render();
        }
      });
    });

    if (window.lucide) window.lucide.createIcons({ root: target });
  }

  // --- SUBVIEW 2: Allocation & Rebalance Tool ---
  function renderRebalanceTab(target, portfolio, state, store, currency, isPrivacy) {
    target.innerHTML = `
      <div class="space-y-6">
        
        <!-- Allocation Visualizer Cards -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          <!-- Actual Allocation Chart -->
          <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-slate-100 text-sm">Current Asset Allocation</h4>
              <span class="text-xs text-slate-400">Actual Breakdown</span>
            </div>
            <div class="h-60 relative flex items-center justify-center">
              <canvas id="canvas-alloc-actual"></canvas>
            </div>
          </div>

          <!-- Target Allocation Chart -->
          <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div class="flex items-center justify-between">
              <h4 class="font-bold text-slate-100 text-sm">Target Asset Allocation</h4>
              <span class="text-xs text-sky-400 font-semibold">Desired Equilibrium</span>
            </div>
            <div class="h-60 relative flex items-center justify-center">
              <canvas id="canvas-alloc-target"></canvas>
            </div>
          </div>

        </div>

        <!-- Actionable Rebalancing Schedule -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h4 class="font-bold text-slate-100 text-sm">Automated Portfolio Rebalancing Orders</h4>
              <p class="text-xs text-slate-400">Step-by-step buys and trims required to return your portfolio to target allocations</p>
            </div>
            <span class="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
              Delta Balanced
            </span>
          </div>

          <div class="divide-y divide-slate-800/80">
            ${portfolio.rebalancingList.map(item => `
              <div class="py-3.5 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <span class="px-2 py-1 rounded-lg text-xs font-bold ${
                    item.action === 'BUY' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    item.action === 'TRIM' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    'bg-slate-800 text-slate-400'
                  }">
                    ${item.action}
                  </span>
                  <div>
                    <h5 class="font-bold text-slate-100 text-xs">${item.symbol} — ${item.name}</h5>
                    <span class="text-[11px] text-slate-400">
                      Actual: <strong class="text-slate-300">${item.actualPct}%</strong> vs Target: <strong class="text-sky-400">${item.targetPct}%</strong>
                    </span>
                  </div>
                </div>

                <div class="text-right">
                  <div class="text-sm font-bold ${item.action === 'BUY' ? 'text-emerald-400' : item.action === 'TRIM' ? 'text-rose-400' : 'text-slate-400'} privacy-value">
                    ${item.action === 'BUY' ? '+' : ''}${formatCurrency(item.dollarAdjustment, currency, isPrivacy)}
                  </div>
                  <div class="text-[11px] text-slate-400">
                    ${item.action === 'HOLD' ? 'In balance' : `${Math.abs(item.shareAdjustment)} shares`}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    setTimeout(() => {
      initAllocationCharts(portfolio.classBreakdown);
    }, 50);
  }

  // --- SUBVIEW 3: Dividend Forecaster ---
  function renderDividendsTab(target, portfolio, state, store, currency, isPrivacy) {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    target.innerHTML = `
      <div class="space-y-6">
        
        <!-- Hero Metrics -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div class="glass-card p-5 rounded-2xl border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Estimated Annual Dividend</span>
            <div class="text-2xl font-extrabold text-sky-400 mt-1 privacy-value">
              ${formatCurrency(portfolio.annualDividendTotal, currency, isPrivacy)}
            </div>
            <span class="text-[11px] text-slate-400 mt-1 block">Passive cash flow</span>
          </div>

          <div class="glass-card p-5 rounded-2xl border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Average Monthly Payout</span>
            <div class="text-2xl font-extrabold text-emerald-400 mt-1 privacy-value">
              ${formatCurrency(portfolio.annualDividendTotal / 12, currency, isPrivacy)}
            </div>
            <span class="text-[11px] text-emerald-400 mt-1 block">DRIP compound accelerator</span>
          </div>

          <div class="glass-card p-5 rounded-2xl border border-slate-800">
            <span class="text-xs text-slate-400 font-medium">Weighted Portfolio Yield</span>
            <div class="text-2xl font-extrabold text-white mt-1">
              ${formatPercent(portfolio.portfolioYieldPct)}
            </div>
            <span class="text-[11px] text-slate-400 mt-1 block">Dividend reinvestment power</span>
          </div>
        </div>

        <!-- 12-Month Projected Bar Chart -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <div class="flex items-center justify-between">
            <h4 class="font-bold text-slate-100 text-sm">12-Month Projected Dividend Payout Schedule</h4>
            <span class="text-xs text-slate-400">Monthly Cash Distributions</span>
          </div>
          <div class="h-64 relative">
            <canvas id="canvas-dividends-chart"></canvas>
          </div>
        </div>

        <!-- Schedule Table -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
          <h4 class="font-bold text-slate-100 text-sm">Holdings Dividend Breakdown</h4>
          <div class="divide-y divide-slate-800">
            ${portfolio.holdings.filter(h => h.annualDividend > 0).map(h => `
              <div class="py-3 flex items-center justify-between">
                <div>
                  <h5 class="font-bold text-slate-200 text-xs">${h.symbol} — ${h.name}</h5>
                  <span class="text-[11px] text-slate-400">Yield: ${formatPercent(h.dividendYield)} • ${h.dividendFrequency} payout</span>
                </div>
                <div class="text-right">
                  <div class="font-bold text-sm text-sky-400 privacy-value">
                    ${formatCurrency(h.annualDividend, currency, isPrivacy)} / yr
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    setTimeout(() => {
      initDividendChart(monthNames, portfolio.monthlyDividendProjection, isPrivacy);
    }, 50);
  }

  // --- SUBVIEW 4: Performance Analytics ---
  function renderPerformanceTab(target, portfolio, state, store, currency, isPrivacy) {
    target.innerHTML = `
      <div class="space-y-6">
        
        <!-- Gainers & Losers -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <!-- Top Gainers -->
          <div class="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <i data-lucide="trending-up" class="w-4 h-4"></i>
              </span>
              <h4 class="font-bold text-slate-100 text-sm">Top Portfolio Gainers</h4>
            </div>
            <div class="divide-y divide-slate-800/80">
              ${portfolio.topGainers.map(h => `
                <div class="py-2.5 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-200 text-xs">${h.symbol}</span>
                    <span class="text-[11px] text-slate-400 ml-2">${h.name}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-emerald-400 text-xs privacy-value">+${formatCurrency(h.gainLoss, currency, isPrivacy)}</span>
                    <span class="text-[10px] text-emerald-400 block">+${formatPercent(h.gainLossPct)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Top Laggards -->
          <div class="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <div class="flex items-center gap-2">
              <span class="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <i data-lucide="trending-down" class="w-4 h-4"></i>
              </span>
              <h4 class="font-bold text-slate-100 text-sm">Unrealized Laggards</h4>
            </div>
            <div class="divide-y divide-slate-800/80">
              ${portfolio.topLosers.length === 0 ? `
                <div class="py-6 text-center text-xs text-slate-500">All current holdings are positive!</div>
              ` : portfolio.topLosers.map(h => `
                <div class="py-2.5 flex items-center justify-between">
                  <div>
                    <span class="font-bold text-slate-200 text-xs">${h.symbol}</span>
                    <span class="text-[11px] text-slate-400 ml-2">${h.name}</span>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-rose-400 text-xs privacy-value">${formatCurrency(h.gainLoss, currency, isPrivacy)}</span>
                    <span class="text-[10px] text-rose-400 block">${formatPercent(h.gainLossPct)}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Asset Class Breakdown Details -->
        <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h4 class="font-bold text-slate-100 text-sm">Asset Class Diversification Weights</h4>
          <div class="space-y-3">
            ${portfolio.classBreakdown.map(cls => `
              <div class="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <div class="flex justify-between items-center mb-1.5">
                  <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full" style="background-color: ${cls.color}"></span>
                    <span class="font-bold text-xs text-slate-200">${cls.label}</span>
                    <span class="text-[10px] text-slate-400">(${cls.holdingsCount} assets)</span>
                  </div>
                  <div class="text-right">
                    <span class="font-bold text-xs text-white privacy-value">${formatCurrency(cls.value, currency, isPrivacy)}</span>
                    <span class="text-xs text-sky-400 ml-2">(${cls.actualPct}%)</span>
                  </div>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full rounded-full transition-all duration-300" style="width: ${cls.actualPct}%; background-color: ${cls.color}"></div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

      </div>
    `;

    if (window.lucide) window.lucide.createIcons({ root: target });
  }

  // --- Chart Initializers ---
  function initAllocationCharts(classBreakdown) {
    if (typeof Chart === 'undefined') return;

    const actualCtx = document.getElementById('canvas-alloc-actual');
    const targetCtx = document.getElementById('canvas-alloc-target');
    if (!actualCtx || !targetCtx) return;

    if (chartInstanceActual) chartInstanceActual.destroy();
    if (chartInstanceTarget) chartInstanceTarget.destroy();

    const labels = classBreakdown.map(c => c.label);
    const colors = classBreakdown.map(c => c.color);
    const actualData = classBreakdown.map(c => c.actualPct);
    const targetData = classBreakdown.map(c => c.targetPct || c.actualPct);

    chartInstanceActual = new Chart(actualCtx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: actualData, backgroundColor: colors, borderWidth: 2, borderColor: '#0f172a' }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }
    });

    chartInstanceTarget = new Chart(targetCtx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data: targetData, backgroundColor: colors, borderWidth: 2, borderColor: '#0f172a' }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { display: false } } }
    });
  }

  function initDividendChart(months, projections, isPrivacy) {
    if (typeof Chart === 'undefined') return;
    const ctx = document.getElementById('canvas-dividends-chart');
    if (!ctx) return;

    if (chartInstanceDividends) chartInstanceDividends.destroy();

    chartInstanceDividends = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'Projected Dividend ($)',
          data: projections,
          backgroundColor: '#0284c7',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: c => isPrivacy ? '••••••' : `$${c.parsed.y.toFixed(2)}` } }
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 10 }, callback: v => isPrivacy ? '••' : `$${v}` } }
        }
      }
    });
  }

  render();
}
