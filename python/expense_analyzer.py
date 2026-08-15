"""
expense_analyzer.py

Reads the same transaction data the frontend uses (data/transactions.json
and data/budgets.json) and produces the kind of summary a "Data manipulation
with Python" line on a resume is meant to demonstrate:

  - total spend and income
  - spend broken down by category
  - which budgets are on track / close / over
  - a month-over-month-style trend if more data is added later

Deliberately dependency-free (uses only the standard library) so it runs
anywhere with `python expense_analyzer.py` — no pip install needed. If
pandas is available, an equivalent DataFrame-based version is sketched
in the docstring at the bottom for reference.

Usage:
    python expense_analyzer.py
    python expense_analyzer.py --export report.csv
"""

import argparse
import csv
import json
from collections import defaultdict
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
TRANSACTIONS_FILE = DATA_DIR / "transactions.json"
BUDGETS_FILE = DATA_DIR / "budgets.json"


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def total_income_expense(transactions):
    income = sum(t["amount"] for t in transactions if t["amount"] > 0)
    expense = sum(-t["amount"] for t in transactions if t["amount"] < 0)
    return income, expense


def spend_by_category(transactions):
    totals = defaultdict(float)
    for t in transactions:
        if t["amount"] < 0:
            totals[t["category"]] += -t["amount"]
    # Sorted descending so the biggest category shows first
    return dict(sorted(totals.items(), key=lambda kv: kv[1], reverse=True))


def budget_status(budgets, spend_totals):
    """
    Returns a list of dicts describing how each budget is doing.
    Status thresholds mirror the ones used in the frontend (js/dashboard.js)
    so the numbers agree wherever a user looks.
    """
    results = []
    for b in budgets:
        spent = spend_totals.get(b["category"], 0)
        pct = round((spent / b["limit"]) * 100, 1) if b["limit"] else 0
        if pct >= 95:
            status = "Over budget"
        elif pct >= 80:
            status = "Getting close"
        else:
            status = "On track"
        results.append({
            "category": b["category"],
            "limit": b["limit"],
            "spent": spent,
            "pct_used": pct,
            "status": status,
        })
    return results


def top_transactions(transactions, n=3):
    expenses = [t for t in transactions if t["amount"] < 0]
    return sorted(expenses, key=lambda t: t["amount"])[:n]


def print_report(transactions, budgets):
    income, expense = total_income_expense(transactions)
    net = income - expense

    print("=" * 50)
    print("TRACKEASY — EXPENSE REPORT")
    print("=" * 50)
    print(f"Total income:  ₹{income:,.0f}")
    print(f"Total expense: ₹{expense:,.0f}")
    print(f"Net balance:   ₹{net:,.0f}\n")

    print("Spend by category:")
    for cat, amount in spend_by_category(transactions).items():
        print(f"  {cat:<15} ₹{amount:,.0f}")

    print("\nBudget status:")
    for b in budget_status(budgets, spend_by_category(transactions)):
        print(f"  {b['category']:<15} {b['pct_used']:>5}% used  →  {b['status']}")

    print("\nTop 3 single expenses:")
    for t in top_transactions(transactions):
        print(f"  {t['date']}  {t['name']:<25} -₹{-t['amount']:,.0f}")


def export_csv(transactions, out_path):
    """Writes a flat CSV — handy for a quick chart in Tableau / Power BI."""
    fieldnames = ["id", "name", "category", "date", "amount"]
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for t in transactions:
            writer.writerow({k: t.get(k, "") for k in fieldnames})
    print(f"Exported {len(transactions)} rows to {out_path}")


def main():
    parser = argparse.ArgumentParser(description="Analyze TrackEasy expense data.")
    parser.add_argument("--export", metavar="FILE.csv", help="Export raw transactions to a CSV file")
    args = parser.parse_args()

    transactions = load_json(TRANSACTIONS_FILE)
    budgets = load_json(BUDGETS_FILE)

    print_report(transactions, budgets)

    if args.export:
        export_csv(transactions, args.export)


if __name__ == "__main__":
    main()


# ---------------------------------------------------------------------------
# Equivalent pandas version, for reference (not used, to keep this
# dependency-free):
#
#   import pandas as pd
#   df = pd.read_json("data/transactions.json")
#   df["type"] = df["amount"].apply(lambda x: "income" if x > 0 else "expense")
#   spend_by_cat = df[df.amount < 0].groupby("category").amount.sum().abs()
#   spend_by_cat.sort_values(ascending=False).to_csv("category_totals.csv")
# ---------------------------------------------------------------------------
