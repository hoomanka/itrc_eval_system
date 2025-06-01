-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Clear tables in reverse order of dependencies
TRUNCATE TABLE evaluations CASCADE;
TRUNCATE TABLE security_targets CASCADE;
TRUNCATE TABLE applications CASCADE;
TRUNCATE TABLE product_subclasses CASCADE;
TRUNCATE TABLE product_classes CASCADE;
TRUNCATE TABLE product_types CASCADE;
TRUNCATE TABLE users CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Reset sequences
ALTER SEQUENCE evaluations_id_seq RESTART WITH 1;
ALTER SEQUENCE security_targets_id_seq RESTART WITH 1;
ALTER SEQUENCE applications_id_seq RESTART WITH 1;
ALTER SEQUENCE product_subclasses_id_seq RESTART WITH 1;
ALTER SEQUENCE product_classes_id_seq RESTART WITH 1;
ALTER SEQUENCE product_types_id_seq RESTART WITH 1;
ALTER SEQUENCE users_id_seq RESTART WITH 1; 