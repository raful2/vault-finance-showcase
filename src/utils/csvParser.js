/**
 * Smart CSV Parser with Automated Category Mapping & Column Detection
 */

export const AUTO_CATEGORY_RULES = [
  { match: /(uber|lyft|shell|chevron|exxon|mobil|bp|gas|transit|metro|subway|parking)/i, category: 'Transportation', macro: 'needs' },
  { match: /(whole foods|trader joe|kroger|safeway|publix|walmart|costco|aldi|supermarket|grocery|market)/i, category: 'Groceries', macro: 'needs' },
  { match: /(restaurant|cafe|coffee|starbucks|bistro|diner|mcdonald|chipotle|burger|pizza|sushi|taco|bar|pub)/i, category: 'Dining & Restaurants', macro: 'wants' },
  { match: /(rent|lease|apartment|property|mortgage|realty)/i, category: 'Rent & Housing', macro: 'needs' },
  { match: /(electric|water|gas|energy|power|utility|comcast|verizon|at&t|internet|wifi)/i, category: 'Utilities', macro: 'needs' },
  { match: /(netflix|spotify|hulu|apple|disney|prime|youtube|patreon|hbo|paramount)/i, category: 'Subscriptions', macro: 'wants' },
  { match: /(pharmacy|cvs|walgreens|doctor|clinic|dental|hospital|medicine|health)/i, category: 'Healthcare', macro: 'needs' },
  { match: /(gym|fitness|yoga|crossfit|planet fitness|workout)/i, category: 'Health & Fitness', macro: 'needs' },
  { match: /(vanguard|fidelity|schwab|robinhood|crypto|coinbase|etrade|investment)/i, category: 'Investment', macro: 'savings' },
  { match: /(payroll|salary|direct dep|wages|employer|client|deposit)/i, category: 'Income', macro: 'income' },
  { match: /(amazon|target|ebay|best buy|apple store|clothing|zara|nike)/i, category: 'Shopping', macro: 'wants' }
];

export function guessCategoryAndMacro(payeeText) {
  if (!payeeText) return { category: 'Other', macro: 'wants' };
  for (const rule of AUTO_CATEGORY_RULES) {
    if (rule.match.test(payeeText)) {
      return { category: rule.category, macro: rule.macro };
    }
  }
  return { category: 'General', macro: 'wants' };
}

/**
 * Parse raw CSV string into rows and detect header columns
 */
export function parseCSV(rawText) {
  const lines = rawText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length < 2) {
    throw new Error('CSV file has insufficient rows (at least header + 1 row required)');
  }

  // Parse CSV line handling quotes
  function parseLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    result.push(cur.trim());
    return result;
  }

  const headers = parseLine(lines[0]);
  const rows = lines.slice(1).map(parseLine).filter(row => row.length === headers.length || row.length >= 3);

  // Auto-detect columns
  let dateIndex = -1;
  let payeeIndex = -1;
  let amountIndex = -1;
  let categoryIndex = -1;

  headers.forEach((h, idx) => {
    const lower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (dateIndex === -1 && (lower.includes('date') || lower.includes('time') || lower.includes('posted'))) {
      dateIndex = idx;
    } else if (amountIndex === -1 && (lower.includes('amount') || lower.includes('total') || lower.includes('sum') || lower.includes('value'))) {
      amountIndex = idx;
    } else if (payeeIndex === -1 && (lower.includes('desc') || lower.includes('payee') || lower.includes('merchant') || lower.includes('name') || lower.includes('detail'))) {
      payeeIndex = idx;
    } else if (categoryIndex === -1 && (lower.includes('cat') || lower.includes('type') || lower.includes('tag'))) {
      categoryIndex = idx;
    }
  });

  // Fallbacks if not detected by header name
  if (dateIndex === -1) dateIndex = 0;
  if (payeeIndex === -1) payeeIndex = 1;
  if (amountIndex === -1) amountIndex = Math.min(2, headers.length - 1);

  return {
    headers,
    detectedMapping: {
      dateIndex,
      payeeIndex,
      amountIndex,
      categoryIndex
    },
    rawRows: rows
  };
}

/**
 * Convert parsed rows into clean Transaction objects
 */
export function processImportedRows(parsedData, mapping, accountId = 'acc-1', defaultCurrency = 'USD') {
  const { rawRows } = parsedData;
  const { dateIndex, payeeIndex, amountIndex, categoryIndex } = mapping;

  return rawRows.map((row, idx) => {
    const rawDate = row[dateIndex] || new Date().toISOString().slice(0, 10);
    const rawPayee = row[payeeIndex] || 'Unnamed Transaction';
    let rawAmount = row[amountIndex] || '0';

    // Clean amount (remove currency signs, commas)
    rawAmount = rawAmount.replace(/[\$,€,£, ]/g, '');
    let numAmount = parseFloat(rawAmount) || 0;

    let detectedCat = categoryIndex !== -1 && row[categoryIndex] ? row[categoryIndex] : null;
    let guessed = guessCategoryAndMacro(rawPayee);

    // Normalize date to YYYY-MM-DD
    let normalizedDate = new Date().toISOString().slice(0, 10);
    try {
      const parsedD = new Date(rawDate);
      if (!isNaN(parsedD.getTime())) {
        normalizedDate = parsedD.toISOString().slice(0, 10);
      }
    } catch {}

    return {
      id: `imported-${Date.now()}-${idx}`,
      date: normalizedDate,
      payee: rawPayee,
      amount: numAmount,
      category: detectedCat || guessed.category,
      macroBucket: numAmount > 0 ? 'income' : guessed.macro,
      accountId,
      currency: defaultCurrency,
      isRecurring: false,
      notes: 'Imported via CSV statement'
    };
  });
}
