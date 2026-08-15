-- queries.sql
-- Example analytical queries against the schema in schema.sql.
-- Written for SQLite; each is annotated with what it answers.

-- 1. Total spend by category, this user, current month
SELECT c.name AS category, ROUND(SUM(-t.amount), 2) AS total_spent
FROM transactions t
JOIN categories c ON c.id = t.category_id
WHERE t.user_id = 1
  AND t.amount < 0
  AND strftime('%Y-%m', t.tx_date) = strftime('%Y-%m', 'now')
GROUP BY c.name
ORDER BY total_spent DESC;

-- 2. Budget vs. actual spend, with a computed status flag
SELECT
    c.name AS category,
    b.monthly_limit,
    COALESCE(spent.total, 0) AS spent,
    ROUND(100.0 * COALESCE(spent.total, 0) / b.monthly_limit, 1) AS pct_used,
    CASE
        WHEN COALESCE(spent.total, 0) >= b.monthly_limit * 0.95 THEN 'Over budget'
        WHEN COALESCE(spent.total, 0) >= b.monthly_limit * 0.80 THEN 'Getting close'
        ELSE 'On track'
    END AS status
FROM budgets b
JOIN categories c ON c.id = b.category_id
LEFT JOIN (
    SELECT category_id, SUM(-amount) AS total
    FROM transactions
    WHERE amount < 0 AND user_id = 1
    GROUP BY category_id
) spent ON spent.category_id = b.category_id
WHERE b.user_id = 1;

-- 3. Monthly net (income - expense) trend, most recent 6 months
SELECT
    strftime('%Y-%m', tx_date) AS month,
    ROUND(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 2) AS income,
    ROUND(SUM(CASE WHEN amount < 0 THEN -amount ELSE 0 END), 2) AS expense,
    ROUND(SUM(amount), 2) AS net
FROM transactions
WHERE user_id = 1
GROUP BY month
ORDER BY month DESC
LIMIT 6;

-- 4. Top 5 single largest expenses ever logged
SELECT name, -amount AS amount, tx_date
FROM transactions
WHERE user_id = 1 AND amount < 0
ORDER BY amount ASC
LIMIT 5;

-- 5. Categories with no budget set yet (useful nudge in the product)
SELECT c.name
FROM categories c
WHERE c.name != 'Income'
  AND NOT EXISTS (
      SELECT 1 FROM budgets b
      WHERE b.category_id = c.id AND b.user_id = 1
  );
