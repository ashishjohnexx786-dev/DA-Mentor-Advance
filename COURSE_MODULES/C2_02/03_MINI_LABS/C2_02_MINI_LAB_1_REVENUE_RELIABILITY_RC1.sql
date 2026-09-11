-- C2-02 MINI-LAB 1 - REVENUE RELIABILITY RC1
-- Attempt after ASQL1-ASQL7.
-- Scenario: Commercial wants region-level revenue and completion KPIs by month.
-- The raw customer master has a duplicate key; returns can have multiple events.
-- Deliver a safe query package without hiding fan-out with DISTINCT.

SET search_path TO c2a_sql_rc1, public;

-- Required evidence:
-- 1. Source and intended output grain.
-- 2. Customer-key quality check and orphan check.
-- 3. Monthly-region KPI query using named stages.
-- 4. Completed orders, eligible orders, completed revenue, completion rate.
-- 5. At least two independent reconciliations.
-- 6. One changed-risk note: what happens if you join raw returns directly to orders?
-- 7. 90-second explain-back.

-- YOUR ATTEMPT:

