-- C2-02 MINI-LAB 2 - CUSTOMER MOMENTUM + QUALITY RC1
-- Attempt after ASQL8-ASQL12 and Mini-Lab 1.
-- Scenario: Customer Success wants monthly customer revenue trend and top-customer exceptions.
-- You must detect time gaps, data-quality issues, and produce maintainable SQL.

SET search_path TO c2a_sql_rc1, public;

-- Required evidence:
-- 1. Typed Jan-Jun half-open time boundary.
-- 2. One row per customer-month.
-- 3. LAG prior-month revenue and explicit missing-period note.
-- 4. Ranking/tie rule for top customers within month.
-- 5. Duplicate/null/orphan/negative-value quality checks.
-- 6. Debug/validation block with rows, distinct keys and control totals.
-- 7. Plain EXPLAIN on one final/selective query; ANALYZE only if you understand it executes.
-- 8. Production-style header + deterministic output + business interpretation.

-- YOUR ATTEMPT:

