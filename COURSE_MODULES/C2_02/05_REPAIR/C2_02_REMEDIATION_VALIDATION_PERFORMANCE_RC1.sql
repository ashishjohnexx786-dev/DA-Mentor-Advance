-- C2-02 TARGETED REMEDIATION - VALIDATION / PERFORMANCE RC1
-- Use only if validation/debugging/EXPLAIN is weak.
SET search_path TO c2a_sql_rc1, public;
-- Fresh task: debug a query whose result count falls after enrichment.
-- Isolate the first failing stage, save row/distinct-key/control-total evidence,
-- then use EXPLAIN on the corrected SELECT. Do not optimize before correctness.
-- YOUR ATTEMPT:
