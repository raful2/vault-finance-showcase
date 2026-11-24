/**
 * Bank Statement CSV Importer Modal
 * Smart column detection, live preview, automated category mapping
 */

import { parseCSV, processImportedRows } from '../../utils/csvParser.js';
import { formatCurrency } from '../../utils/formatters.js';

export function openCsvImportModal(state, store, onComplete) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  let parsedResult = null;
  let activeMapping = null;
  let selectedAccountId = state.accounts[0]?.id || 'acc-1';

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
              <h3 class="font-bold text-slate-100 text-base">Import Bank Statement (CSV)</h3>
              <p class="text-xs text-slate-400">Upload bank or credit card exports with auto-categorization</p>
            </div>
          </div>
          <button id="btn-close-modal" class="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition">
            <i data-lucide="x" class="w-5 h-5"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="p-6 space-y-6 overflow-y-auto flex-1">
          
          <!-- Dropzone -->
          <div id="csv-dropzone" class="border-2 border-dashed border-slate-700 hover:border-sky-500/60 rounded-2xl p-8 text-center transition cursor-pointer bg-slate-900/50 group">
            <input type="file" id="csv-file-input" accept=".csv,text/csv" class="hidden">
            <i data-lucide="file-spreadsheet" class="w-10 h-10 mx-auto mb-3 text-slate-400 group-hover:text-sky-400 transition"></i>
            <h4 class="font-semibold text-sm text-slate-200">Click to upload or drag & drop CSV file</h4>
            <p class="text-xs text-slate-400 mt-1">Supports Chase, Bank of America, Wells Fargo, Amex, Capital One, Revolut, etc.</p>
          </div>

          <!-- Configuration Step (Hidden until file selected) -->
          <div id="csv-config-step" class="hidden space-y-4">
            
            <div class="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <div>
                <label class="block text-xs font-semibold text-slate-300 mb-1">Import into Account:</label>
                <select id="select-import-account" class="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-sky-500 focus:outline-none">
                  ${state.accounts.map(acc => `
                    <option value="${acc.id}">${acc.name} (${acc.institution})</option>
                  `).join('')}
                </select>
              </div>

              <div id="file-info-badge" class="text-xs text-slate-400">
                <!-- Injected info -->
              </div>
            </div>

            <!-- Column Mapping Controls -->
            <div class="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h4 class="text-xs font-bold uppercase tracking-wider text-slate-400">Column Mapping Alignment</h4>
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Date Column</label>
                  <select id="map-date" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"></select>
                </div>
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Payee / Description</label>
                  <select id="map-payee" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"></select>
                </div>
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Amount Column</label>
                  <select id="map-amount" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"></select>
                </div>
                <div>
                  <label class="block text-[11px] text-slate-400 mb-1">Category (Optional)</label>
                  <select id="map-category" class="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg p-2"></select>
                </div>
              </div>
            </div>

            <!-- Live Preview Table -->
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs text-slate-400">
                <span class="font-semibold text-slate-300">Live Import Preview (First 5 Rows)</span>
                <span class="text-emerald-400 font-medium">✓ Smart auto-categorization active</span>
              </div>
              <div class="border border-slate-800 rounded-xl overflow-hidden">
                <div class="overflow-x-auto max-h-48">
                  <table class="w-full text-left text-xs text-slate-300">
                    <thead class="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                      <tr>
                        <th class="p-2">Date</th>
                        <th class="p-2">Payee</th>
                        <th class="p-2">Auto Category</th>
                        <th class="p-2">Bucket</th>
                        <th class="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody id="preview-tbody" class="divide-y divide-slate-800/80"></tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Footer -->
        <div class="p-5 border-t border-slate-800 bg-surface-950 flex justify-end gap-3">
          <button id="btn-cancel-modal" class="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition">
            Cancel
          </button>
          <button id="btn-confirm-import" disabled class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-sky-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-400 shadow-lg shadow-sky-500/20 flex items-center gap-2 transition">
            <i data-lucide="check" class="w-4 h-4"></i>
            <span>Confirm & Import</span>
          </button>
        </div>

      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons({ root: modalContainer });
  }

  // Close handlers
  const closeModal = () => {
    modalContainer.innerHTML = '';
  };

  modalContainer.querySelector('#btn-close-modal').addEventListener('click', closeModal);
  modalContainer.querySelector('#btn-cancel-modal').addEventListener('click', closeModal);

  // File selection handling
  const dropzone = modalContainer.querySelector('#csv-dropzone');
  const fileInput = modalContainer.querySelector('#csv-file-input');
  const configStep = modalContainer.querySelector('#csv-config-step');
  const confirmBtn = modalContainer.querySelector('#btn-confirm-import');

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
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFile(e.target.files[0]);
    }
  });

  function handleFile(file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        parsedResult = parseCSV(text);
        activeMapping = { ...parsedResult.detectedMapping };

        // Show config step
        configStep.classList.remove('hidden');
        dropzone.classList.add('hidden');
        confirmBtn.removeAttribute('disabled');

        modalContainer.querySelector('#file-info-badge').innerHTML = `
          <strong>${file.name}</strong> • ${parsedResult.rawRows.length} transactions detected
        `;

        setupMappingSelects();
        updatePreview();
      } catch (err) {
        alert('Could not parse CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  function setupMappingSelects() {
    const { headers } = parsedResult;

    function populate(selectId, defaultIndex) {
      const select = modalContainer.querySelector(selectId);
      select.innerHTML = headers.map((h, i) => `
        <option value="${i}" ${i === defaultIndex ? 'selected' : ''}>${h}</option>
      `).join('');
      if (selectId === '#map-category') {
        select.innerHTML = `<option value="-1">-- Auto-Detect Category --</option>` + select.innerHTML;
      }
    }

    populate('#map-date', activeMapping.dateIndex);
    populate('#map-payee', activeMapping.payeeIndex);
    populate('#map-amount', activeMapping.amountIndex);
    populate('#map-category', activeMapping.categoryIndex);

    modalContainer.querySelector('#map-date').addEventListener('change', e => {
      activeMapping.dateIndex = parseInt(e.target.value);
      updatePreview();
    });
    modalContainer.querySelector('#map-payee').addEventListener('change', e => {
      activeMapping.payeeIndex = parseInt(e.target.value);
      updatePreview();
    });
    modalContainer.querySelector('#map-amount').addEventListener('change', e => {
      activeMapping.amountIndex = parseInt(e.target.value);
      updatePreview();
    });
    modalContainer.querySelector('#map-category').addEventListener('change', e => {
      activeMapping.categoryIndex = parseInt(e.target.value);
      updatePreview();
    });

    modalContainer.querySelector('#select-import-account').addEventListener('change', e => {
      selectedAccountId = e.target.value;
    });
  }

  function updatePreview() {
    const previewRows = {
      ...parsedResult,
      rawRows: parsedResult.rawRows.slice(0, 5)
    };
    const processed = processImportedRows(previewRows, activeMapping, selectedAccountId, state.settings.primaryCurrency);
    const tbody = modalContainer.querySelector('#preview-tbody');

    tbody.innerHTML = processed.map(tx => `
      <tr class="hover:bg-slate-800/40">
        <td class="p-2 text-slate-400 font-mono">${tx.date}</td>
        <td class="p-2 font-medium text-slate-200">${tx.payee}</td>
        <td class="p-2">
          <span class="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
            ${tx.category}
          </span>
        </td>
        <td class="p-2 uppercase text-[10px] text-slate-400 font-bold">${tx.macroBucket}</td>
        <td class="p-2 text-right font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-100'}">
          ${formatCurrency(tx.amount, state.settings.primaryCurrency)}
        </td>
      </tr>
    `).join('');
  }

  confirmBtn.addEventListener('click', () => {
    if (!parsedResult || !activeMapping) return;

    const allProcessed = processImportedRows(parsedResult, activeMapping, selectedAccountId, state.settings.primaryCurrency);
    store.importTransactions(allProcessed, selectedAccountId);

    closeModal();
    if (onComplete) onComplete(allProcessed.length);
  });
}
