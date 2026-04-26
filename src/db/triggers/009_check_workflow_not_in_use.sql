-- 009_check_workflow_not_in_use.sql
--
-- Prevents modifying workflow steps while a workflow instance is pending

CREATE OR REPLACE FUNCTION check_workflow_not_in_use()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM workflow_instance
        WHERE workflow_id = OLD.workflow_id
        AND status = 'pending'
    ) THEN
        RAISE EXCEPTION
            'workflow_step: cannot modify step % because workflow % has a pending instance',
            OLD.id,
            OLD.workflow_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

---split---
DROP TRIGGER IF EXISTS trg_check_workflow_not_in_use ON workflow_step;

---split---
CREATE TRIGGER trg_check_workflow_not_in_use
BEFORE UPDATE OR DELETE
ON workflow_step
FOR EACH ROW EXECUTE FUNCTION check_workflow_not_in_use();
