/**
 * Brokerage Portfolio CSV Importer Modal
 */

import { parseCSV } from '../../utils/csvParser.js';
import { formatCurrency } from '../../utils/formatters.js';

export function openCsvHoldingImportModal(state, store, onComplete) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  let parsedResult = null;
  let activeMapping = {
    symbolIndex: 0,
    nameIndex: 1,
    sharesIndex: 2,
    costIndex: 3,
    priceIndex: 4
  };

  modalContainer.innerHTML = `
    <div class="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div class="bg-surface-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="p-5 border-b border-slate-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center font-bold">
              <i data-lucide="upload-cloud" class="w-5 h-5"></i>
            </div>
            <div>
              <h3 class="font-bold text-slate-100 text-base">Import Brokerage Portfolio (CSV)</h3>
              <p class="text-xs text-slate-400">Bulk import holdings from Vanguard, Fidelity, Schwab, or Robinhood exports</p>
            </div>
          </div>
          <button id="btn-close-holdings-csv-modal" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          
          <!-- Dropzone -->
          <div id="holdings-csv-dropzone" class="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-8 text-center transition cursor-pointer bg-slate-900/50 group">
            <input type="file" id="holdings-csv-file-input" accept=".csv,text/csv" class="hidden">
            <i data-lucide="pie-chart" class="w-10 h-10 mx-auto mb-3 text-slate-400 group-hover:text-sky-400 transition"></i>
            <h4 class="font-semibold text-sm text-slate-200">Click to select or drag & drop portfolio CSV</h4>
            <p class="text-xs text-slate-400 mt-1">Requires at least Symbol/Ticker, Quantity/Shares, and Purchase Price / Current Price</p>
          </div>

          <!-- Config Step -->
          <div id="holdings-csv-config-step" class="hidden space-y-4">
            
            <div id="holdings-file-info-badge" class="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs text-slate-300 font-medium"></div>

            <!-- Column Alignments -->
            <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Column Mapping Alignment</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Ticker / Symbol</label>
                  <select id="map-h-symbol" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"></select>
                </div>
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Asset Name</label>
                  <select id="map-h-name" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"></select>
                </div>
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Quantity / Shares</label>
                  <select id="map-h-shares" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"></select>
                </div>
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Cost Basis / Share</label>
                  <select id="map-h-cost" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"></select>
                </div>
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Current Price</label>
                  <select id="map-h-price" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"></select>
                </div>
              </div>
            </div>

            <!-- Preview Table -->
            <div class="space-y-2">
              <span class="font-semibold text-xs text-slate-300">Live Import Preview (First 5 Holdings)</span>
              <div class="border border-slate-800 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table class="w-full text-left text-xs text-slate-300">
                  <thead class="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                    <tr>
                      <th class="p-2">Symbol</th>
                      <th class="p-2">Name</th>
                      <th class="p-2 text-right">Shares</th>
                      <th class="p-2 text-right">Cost</th>
                      <th class="p-2 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody id="holdings-preview-tbody" class="divide-y divide-slate-800/80"></tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-slate-800 bg-surface-950 flex justify-end gap-3">
          <button id="btn-cancel-holdings-modal" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition">Cancel</button>
          <button id="btn-confirm-holdings-import" disabled class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-400 shadow-lg shadow-sky-500/20 flex items-center gap-2 transition">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Import Holdings</span>
          </button>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons({ root: modalContainer });

  const closeModal = () => { modalContainer.innerHTML = ''; };
  modalContainer.querySelector('#btn-close-holdings-csv-modal').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-cancel-holdings-modal').addEventListener('click', closeModal);

  const dropzone = modalContainer.querySelector('#holdings-csv-dropzone');
  const fileInput = modalContainer.querySelector('#holdings-csv-file-input');
  const configStep = modalContainer.querySelector('#holdings-csv-config-step');
  const confirmBtn = modalContainer.querySelector('#btn-confirm-holdings-import');

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('border-sky-500', 'bg-sky-500/5');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('border-sky-500', 'bg-sky-500/5');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('border-sky-500', 'bg-sky-500/5');
    if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFile(e.target.files[0]);
  });

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        parsedResult = parseCSV(evt.target.result);
        autoDetectHoldingsColumns(parsedResult.headers);

        configStep.classList.remove('hidden');
        dropzone.classList.add('hidden');
        confirmBtn.removeAttribute('disabled');

        modalContainer.querySelector('#holdings-file-info-badge').innerHTML = `
          <strong>${file.name}</strong> • ${parsedResult.rawRows.length} assets detected
        `;

        setupSelects();
        updatePreview();
      } catch (err) {
        alert('Could not parse holdings CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function autoDetectHoldingsColumns(headers) {
    headers.forEach((h, idx) => {
      const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lower.includes('symbol') || lower.includes('ticker')) activeMapping.symbolIndex = idx;
      else if (lower.includes('name') || lower.includes('desc') || lower.includes('security')) activeMapping.nameIndex = idx;
      else if (lower.includes('share') || lower.includes('qty') || lower.includes('quantity')) activeMapping.sharesIndex = idx;
      else if (lower.includes('cost') || lower.includes('basis') || lower.includes('purchase')) activeMapping.costIndex = idx;
      else if (lower.includes('price') || lower.includes('last') || lower.includes('current')) activeMapping.priceIndex = idx;
    });
  }

  function setupSelects() {
    const { headers } = parsedResult;
    function populate(id, defaultIdx) {
      const el = modalContainer.querySelector(id);
      el.innerHTML = headers.map((h, i) => `<option value="${i}" ${i === defaultIdx ? 'selected' : ''}>${h}</option>`).join('');
    }

    populate('#map-h-symbol', activeMapping.symbolIndex);
    populate('#map-h-name', activeMapping.nameIndex);
    populate('#map-h-shares', activeMapping.sharesIndex);
    populate('#map-h-cost', activeMapping.costIndex);
    populate('#map-h-price', activeMapping.priceIndex);

    ['symbol', 'name', 'shares', 'cost', 'price'].forEach(key => {
      modalContainer.querySelector(`#map-h-${key}`).addEventListener('change', e => {
        activeMapping[`${key}Index`] = parseInt(e.target.value);
        updatePreview();
      });
    });
  }

  function processRows(rows) {
    return rows.map((r, i) => {
      const symbol = (r[activeMapping.symbolIndex] || `ASSET-${i}`).replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const name = r[activeMapping.nameIndex] || symbol;
      const rawShares = (r[activeMapping.sharesIndex] || '0').replace(/[\$, ]/g, '');
      const rawCost = (r[activeMapping.costIndex] || '0').replace(/[\$, ]/g, '');
      const rawPrice = (r[activeMapping.priceIndex] || rawCost).replace(/[\$, ]/g, '');

      const shares = parseFloat(rawShares) || 0;
      const costBasis = parseFloat(rawCost) || 0;
      const currentPrice = parseFloat(rawPrice) || costBasis;

      // Guess asset class
      let assetClass = 'stock';
      if (['BTC', 'ETH', 'SOL', 'ADA', 'DOGE'].includes(symbol)) assetClass = 'crypto';
      else if (symbol.length === 3 || symbol.endsWith('X') || name.toLowerCase().includes('etf') || name.toLowerCase().includes('index')) assetClass = 'etf';
      else if (name.toLowerCase().includes('bond')) assetClass = 'bond';

      return {
        symbol,
        name,
        assetClass,
        shares,
        costBasis,
        currentPrice,
        dividendYield: assetClass === 'bond' ? 3.5 : assetClass === 'etf' ? 1.8 : 0.8,
        dividendFrequency: 'quarterly',
        targetAllocationPct: 15,
        accountId: 'acc-4'
      };
    }).filter(h => h.shares > 0);
  }

  function updatePreview() {
    const preview = processRows(parsedResult.rawRows.slice(0, 5));
    const tbody = modalContainer.querySelector('#holdings-preview-tbody');
    tbody.innerHTML = preview.map(h => `
      <tr class="hover:bg-slate-800/40">
        <td class="p-2 font-bold text-sky-400 font-mono">${h.symbol}</td>
        <td class="p-2 text-slate-200">${h.name}</td>
        <td class="p-2 text-right font-mono">${h.shares}</td>
        <td class="p-2 text-right font-mono">${formatCurrency(h.costBasis)}</td>
        <td class="p-2 text-right font-mono font-bold text-emerald-400">${formatCurrency(h.currentPrice)}</td>
      </tr>
    `).join('');
  }

  confirmBtn.addEventListener('click', () => {
    if (!parsedResult) return;
    const all = processRows(parsedResult.rawRows);
    store.importHoldings(all);
    closeModal();
    if (onComplete) onComplete(all.length);
  });
}
