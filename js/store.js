/**
 * store.js
 * A tiny in-browser "data layer". In a real product this would be
 * replaced by fetch() calls to a backend API — see /python and /sql
 * in this repo for what that API's data processing would look like.
 * Here, seed data ships with the app and anything the user adds is
 * persisted to localStorage, so the app is fully usable with zero setup.
 */

const SEED_TRANSACTIONS = [
  { id: 1, name: "Swiggy Order", category: "Dining", date: "2026-08-14", amount: -840 },
  { id: 2, name: "BigBasket Groceries", category: "Groceries", date: "2026-08-13", amount: -1560 },
  { id: 3, name: "BESCOM Electricity Bill", category: "Utilities", date: "2026-08-10", amount: -920 },
  { id: 4, name: "Salary Credit", category: "Income", date: "2026-08-01", amount: 52000 },
  { id: 5, name: "Myntra", category: "Shopping", date: "2026-08-09", amount: -2350 },
  { id: 6, name: "Netflix Subscription", category: "Entertainment", date: "2026-08-05", amount: -499 },
  { id: 7, name: "Uber Ride", category: "Transport", date: "2026-08-12", amount: -310 },
  { id: 8, name: "Zomato Order", category: "Dining", date: "2026-08-11", amount: -560 },
  { id: 9, name: "Freelance Payment", category: "Income", date: "2026-08-07", amount: 8000 },
  { id: 10, name: "Gym Membership", category: "Health", date: "2026-08-03", amount: -1200 },
  { id: 11, name: "PVR Movie Tickets", category: "Entertainment", date: "2026-08-08", amount: -640 },
  { id: 12, name: "Amazon Order", category: "Shopping", date: "2026-08-06", amount: -1899 },
];

const SEED_BUDGETS = [
  { category: "Dining", limit: 3000 },
  { category: "Groceries", limit: 4000 },
  { category: "Shopping", limit: 5000 },
  { category: "Entertainment", limit: 1500 },
  { category: "Transport", limit: 2000 },
];

const CATEGORY_ICONS = {
  Dining: "🍽️", Groceries: "🛒", Utilities: "⚡", Income: "💰",
  Shopping: "🛍️", Entertainment: "🎬", Transport: "🚕", Health: "💪",
};

const STORAGE_KEY = "trackeasy-transactions";

const Store = {
  /** Returns all transactions: seed data + anything the user added. */
  getTransactions() {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return stored ? [...SEED_TRANSACTIONS, ...stored] : [...SEED_TRANSACTIONS];
  },

  /** Adds a new transaction and persists just the user-added ones. */
  addTransaction(tx) {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const newTx = {
      id: Date.now(),
      name: tx.name,
      category: tx.category,
      date: tx.date,
      amount: tx.type === "expense" ? -Math.abs(tx.amount) : Math.abs(tx.amount),
    };
    stored.push(newTx);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    return newTx;
  },

  getBudgets() {
    return SEED_BUDGETS;
  },

  /** Sums this month's transactions per category (spend is positive number). */
  spendByCategory() {
    const totals = {};
    this.getTransactions().forEach((tx) => {
      if (tx.amount < 0) {
        totals[tx.category] = (totals[tx.category] || 0) + Math.abs(tx.amount);
      }
    });
    return totals;
  },

  summary() {
    const txs = this.getTransactions();
    const income = txs.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    const expense = txs.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
    return { income, expense, net: income - expense };
  },
};
