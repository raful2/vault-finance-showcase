/**
 * Smart Financial Insights & AI Spending Pattern Engine View
 */

import { analyzeFinances } from '../../utils/insightsEngine.js';
import { formatCurrency, formatPercent } from '../../utils/formatters.js';

export function renderInsights(container, state, store) {
  const analysis = analyzeFinances(state);
  const currency = state.settings.primaryCurrency || 'USD';
  const isPrivacy = state.settings.privacyBlur;

  container.innerHTML = `
    <div class="space-y-6">
      
      <!-- Top Health Banner -->
      <div class="glass-card p-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div class="flex items-center gap-2 mb-1">
            <span class="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <i data-lucide="sparkles" class="w-4 h-4"></i>
            </span>
            <h3 class="font-bold text-white text-base">Automated Spending & Wealth Advisor</h3>
          </div>
          <p class="text-xs text-slate-400">Algorithmic pattern detection, budget leak warnings, and compound growth tips</p>
        </div>

        <div class="text-right">
          <span class="text-xs text-slate-400">Computed Health Score:</span>
          <div class="text-3xl font-extrabold text-indigo-400">${analysis.healthScore} <span class="text-xs text-slate-500">/ 100</span></div>
        </div>
      </div>

      <!-- Actionable Insights Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${analysis.insights.map(item => `
          <div class="p-5 rounded-2xl border ${
            item.type === 'success' ? 'bg-emerald-500/5 border-emerald-500/20' :
            item.type === 'danger' ? 'bg-rose-500/5 border-rose-500/20' :
            item.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' :
            'bg-sky-500/5 border-sky-500/20'
          } space-y-2">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                item.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' :
                item.type === 'danger' ? 'bg-rose-500/15 text-rose-400' :
                item.type === 'warning' ? 'bg-amber-500/15 text-amber-400' :
                'bg-sky-500/15 text-sky-400'
              }">
                <i data-lucide="${item.icon}" class="w-4 h-4"></i>
              </div>
              <h4 class="font-bold text-slate-100 text-sm">${item.title}</h4>
            </div>
            <p class="text-xs text-slate-300 leading-relaxed pl-10">${item.description}</p>
          </div>
        `).join('')}
      </div>

      <!-- Spending Heatmap & Distribution -->
      <div class="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h4 class="font-bold text-slate-100 text-sm">Category Spend Distribution & Share of Outflow</h4>
        <div class="space-y-3">
          ${Object.entries(analysis.categoryTotals).sort((a,b)=>b[1]-a[1]).map(([cat, amt]) => {
            const share = analysis.totalExpenses > 0 ? Math.round((amt / analysis.totalExpenses) * 100) : 0;
            return `
              <div>
                <div class="flex justify-between text-xs mb-1">
                  <span class="font-medium text-slate-300">${cat}</span>
                  <span class="font-bold text-slate-200 privacy-value">${formatCurrency(amt, currency, isPrivacy)} (${share}%)</span>
                </div>
                <div class="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" style="width: ${share}%"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: container });
  }
}
