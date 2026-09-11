-- COURSE 2A - C2-02 ADVANCED SQL - INDEPENDENT PRACTICE RC1
-- Run C2_02_POSTGRESQL_LAB_SETUP_RC1.sql first.
-- Rule: write expected result grain and one validation plan BEFORE your main query.
-- Save genuine attempt before protected review. Do not overwrite your first attempt.
SET search_path TO c2a_sql_rc1, public;

-- ================================================================
-- P-ASQL1 - Advanced joins and grain control
-- YOUR JOB: Return one row per non-cancelled order with line-item value. State orders grain, items grain, expected output grain, and prove no unexpected fan-out.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL2 - Subqueries and derived tables
-- YOUR JOB: Return customers whose non-cancelled revenue is above average customer revenue. Run and save each inner result independently before final filter.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL3 - CTEs and readable query architecture
-- YOUR JOB: Build base_scope -> customer_month -> validated -> final using non-cancelled orders. Save row/distinct-key/control-total checks for each stage.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL4 - Window functions fundamentals
-- YOUR JOB: Show each completed order plus total completed revenue for that customer. Prove output row count equals base completed-order row count.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL5 - Ranking, partitions and running calculations
-- YOUR JOB: Rank completed orders by value within customer and create running completed revenue ordered by order_ts, order_id. Document tie rule and explicit ROWS frame.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL6 - LAG/LEAD and time-based comparisons
-- YOUR JOB: Create monthly non-cancelled revenue, then prior-month revenue and change. Detect whether any calendar month is missing before interpreting LAG.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL7 - Conditional aggregation and advanced KPI queries
-- YOUR JOB: By region return completed orders, eligible non-cancelled orders, completed revenue and completion rate. Validate numerator/denominator independently.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL8 - Date/time analysis
-- YOUR JOB: Return monthly completed revenue for Jan-Jun 2026 using a half-open timestamp interval and date_trunc. Save min/max boundary checks.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL9 - Data-quality investigation with SQL
-- YOUR JOB: Produce separate exception sets for duplicate customer IDs, missing customer region, orphan order customer, orphan return order, negative order value and unexpected status/category.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL10 - Query debugging and validation
-- YOUR JOB: A provided bad query doubles order value after an item join. Identify the first stage where rows/distinct order IDs/control total diverge, repair the cause, rerun all controls.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL11 - EXPLAIN and index awareness
-- YOUR JOB: After proving a selective query correct, record plain EXPLAIN. In a safe lab only, optionally run EXPLAIN (ANALYZE, BUFFERS). Create one practice index, compare plan/result, then state trade-off.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:

-- ================================================================
-- P-ASQL12 - Maintainable production-style analytical SQL
-- YOUR JOB: Deliver a regional monthly performance query with header contract, named stages, quality exceptions, validation block, deterministic output and a short business interpretation.
-- Before SQL: expected result grain = 
-- Validation query / control you will use = 
-- Main attempt below:


-- Validation SQL below:


-- Biggest uncertainty / failure mode:
-- Explain-back note:
