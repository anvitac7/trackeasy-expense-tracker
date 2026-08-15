/**
 * dashboard.js
 * Renders the stat cards, budget progress bars, and recent-transactions
 * list on dashboard.html by reading from Store (js/store.js) and
 * building DOM nodes directly — no templating library.
 */

function renderStats() {
  const { income, expense, net } = Store.summary();
  const grid = document.getElementById('statGrid');

  const stats = [
    { label: 'Total Income', value: formatINR(income), delta: 'up', deltaText: 'This month' },
    { label: 'Total Spent', value: formatINR(expense), delta: 'down', deltaText: 'This month' },
    { label: 'Net Balance', value: formatINR(net), delta: net >= 0 ? 'up' : 'down', deltaText: net >= 0 ? 'Healthy' : 'Overspending' },
    { label: 'Transactions', value: Store.getTransactions().length, delta: 'up', deltaText: 'Logged' },
  ];

  grid.innerHTML = stats.map((s) => `
    <div class="stat-card">
      <div class="stat-label">${escapeHTML(s.label)}</div>
      <div class="stat-value">${typeof s.value === 'number' ? s.value : escapeHTML(s.value)}</div>
      <div class="stat-delta ${s.delta}">${escapeHTML(s.deltaText)}</div>
    </div>
  `).join('');
}

function budgetStatus(pct) {
  if (pct >= 95) return { label: 'Over budget 🔥', color: 'var(--color-coral)' };
  if (pct >= 80) return { label: 'Getting close ☀️', color: 'var(--color-secondary)' };
  return { label: 'On track 🌿', color: 'var(--color-teal)' };
}

function renderBudgets() {
  const spend = Store.spendByCategory();
  const container = document.getElementById('budgetList');
  const budgets = Store.getBudgets();

  if (budgets.length === 0) {
    container.innerHTML = `<div class="empty-state">No budgets set yet.</div>`;
    return;
  }

  container.innerHTML = budgets.map((b) => {
    const spent = spend[b.category] || 0;
    const pct = Math.min(100, Math.round((spent / b.limit) * 100));
    const status = budgetStatus(pct);
    return `
      <div class="budget-row">
        <div class="budget-row-top">
          <span>${escapeHTML(b.category)}</span>
          <span class="status" style="color:${status.color}">${status.label}</span>
        </div>
        <div class="budget-track">
          <div class="budget-fill" data-target-width="${pct}%" style="background:${status.color}"></div>
        </div>
        <div style="font-size:0.8rem; color:var(--color-muted); margin-top:0.25rem;">
          ${formatINR(spent)} of ${formatINR(b.limit)}
        </div>
      </div>
    `;
  }).join('');

  // Animate bars in on next frame (starts at width:0 from CSS, then grows)
  requestAnimationFrame(() => {
    document.querySelectorAll('.budget-fill').forEach((el) => {
      el.style.width = el.dataset.targetWidth;
    });
  });
}

function renderRecentTransactions() {
  const list = document.getElementById('recentTxList');
  const txs = [...Store.getTransactions()]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (txs.length === 0) {
    list.innerHTML = `<div class="empty-state">No transactions yet. Add your first one →</div>`;
    return;
  }

  list.innerHTML = txs.map((tx) => {
    const isNegative = tx.amount < 0;
    return `
      <div class="tx-row">
        <div class="tx-icon" data-category="${escapeHTML(tx.category)}">${CATEGORY_ICONS[tx.category] || '💳'}</div>
        <div class="tx-info">
          <div class="tx-name">${escapeHTML(tx.name)}</div>
          <div class="tx-meta">${escapeHTML(tx.category)} · ${formatDate(tx.date)}</div>
        </div>
        <div class="tx-amount ${isNegative ? 'negative' : 'positive'}">${formatINR(tx.amount)}</div>
      </div>
    `;
  }).join('');
}

function formatDate(isoDate) {
  const d = new Date(isoDate);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  renderBudgets();
  renderRecentTransactions();
});
