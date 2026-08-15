/**
 * transactions.js
 * Renders the full transaction list, wires up live search + category
 * filter (both purely client-side, no reload), and handles the
 * "add transaction" modal including validation.
 */

let currentFilters = { search: '', category: '' };

function getFilteredTransactions() {
  const { search, category } = currentFilters;
  return Store.getTransactions()
    .filter((tx) => (category ? tx.category === category : true))
    .filter((tx) => tx.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

function renderCategoryOptions() {
  const select = document.getElementById('categoryFilter');
  const categories = [...new Set(Store.getTransactions().map((t) => t.category))].sort();
  categories.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

function renderTransactionList() {
  const list = document.getElementById('fullTxList');
  const txs = getFilteredTransactions();
  const countLabel = document.getElementById('txCount');

  countLabel.textContent = `${txs.length} transaction${txs.length === 1 ? '' : 's'}`;

  if (txs.length === 0) {
    list.innerHTML = `<div class="empty-state">No transactions match your search.</div>`;
    return;
  }

  list.innerHTML = txs.map((tx) => {
    const isNegative = tx.amount < 0;
    return `
      <div class="tx-row">
        <div class="tx-icon" data-category="${escapeHTML(tx.category)}">${CATEGORY_ICONS[tx.category] || '💳'}</div>
        <div class="tx-info">
          <div class="tx-name">${escapeHTML(tx.name)}</div>
          <div class="tx-meta">${escapeHTML(tx.category)} · ${new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
        <div class="tx-amount ${isNegative ? 'negative' : 'positive'}">${formatINR(tx.amount)}</div>
      </div>
    `;
  }).join('');
}

// ---------- Search + filter wiring ----------
function initFilters() {
  const searchInput = document.getElementById('searchInput');
  const categorySelect = document.getElementById('categoryFilter');

  searchInput.addEventListener('input', (e) => {
    currentFilters.search = e.target.value;
    renderTransactionList();
  });

  categorySelect.addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    renderTransactionList();
  });
}

// ---------- Modal ----------
function initModal() {
  const backdrop = document.getElementById('modalBackdrop');
  const openBtn = document.getElementById('openAddModal');
  const cancelBtn = document.getElementById('cancelAddModal');
  const form = document.getElementById('txForm');
  const dateInput = document.getElementById('txDate');

  const open = () => {
    backdrop.classList.add('open');
    dateInput.value = new Date().toISOString().slice(0, 10); // default to today
    document.getElementById('txName').focus();
  };
  const close = () => {
    backdrop.classList.remove('open');
    form.reset();
    clearErrors();
  };

  openBtn.addEventListener('click', open);
  cancelBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) close();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formData = new FormData(form);
    Store.addTransaction({
      name: formData.get('name').trim(),
      amount: Number(formData.get('amount')),
      type: formData.get('type'),
      category: formData.get('category'),
      date: formData.get('date'),
    });

    close();
    renderTransactionList();
    window.showToast('Transaction added ✓');
  });
}

/** Simple, explicit client-side validation — no library. */
function validateForm() {
  clearErrors();
  let valid = true;

  const name = document.getElementById('txName').value.trim();
  const amount = document.getElementById('txAmount').value;
  const date = document.getElementById('txDate').value;

  if (name.length === 0) {
    setFieldError('txName', 'txNameError');
    valid = false;
  }
  if (!amount || Number(amount) <= 0) {
    setFieldError('txAmount', 'txAmountError');
    valid = false;
  }
  if (!date) {
    setFieldError('txDate', 'txDateError');
    valid = false;
  }

  return valid;
}

function setFieldError(inputId, errorId) {
  document.getElementById(inputId).closest('.form-field').classList.add('invalid');
  document.getElementById(errorId).style.display = 'block';
}

function clearErrors() {
  document.querySelectorAll('.form-field').forEach((f) => f.classList.remove('invalid'));
  document.querySelectorAll('.field-error').forEach((e) => (e.style.display = 'none'));
}

document.addEventListener('DOMContentLoaded', () => {
  renderCategoryOptions();
  renderTransactionList();
  initFilters();
  initModal();
});
