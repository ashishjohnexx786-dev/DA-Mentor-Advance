-- C2-02 TARGETED REMEDIATION - GRAIN / JOIN RC1
-- Use only if the weak competency is join/grain/cardinality.
SET search_path TO c2a_sql_rc1, public;
-- Fresh task: produce one row per customer with completed revenue and item quantity.
-- You must NOT join customer raw -> orders -> items and then sum order_value blindly.
-- Evidence: grain table, duplicate customer-key check, orphan check, before/after row counts,
-- distinct business keys, and two independent control totals.
-- YOUR ATTEMPT:
