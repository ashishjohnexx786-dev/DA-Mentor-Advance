-- C2-02 TARGETED REMEDIATION - WINDOW / TIME RC1
-- Use only if ranking/LAG/time boundary is weak.
SET search_path TO c2a_sql_rc1, public;
-- Fresh task: weekly completed revenue per region, prior-week change, and top 2 customers per region-week.
-- Include one deliberate tie policy, explicit ROWS frame where running totals are used,
-- and detect missing weeks before interpreting LAG.
-- YOUR ATTEMPT:
