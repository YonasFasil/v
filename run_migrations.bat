@echo off
set PGPASSWORD=ZxOp1029!!%%

echo Running migration 1...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d venuedb -f migrations\001_add_tenant_isolation.sql

echo Running migration 2...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d venuedb -f migrations\002_lockdown_roles.sql

echo Running migration 3...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d venuedb -f migrations\003_enable_force_rls.sql

echo Running migration 4...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d venuedb -f migrations\004_tenant_constraints.sql

echo Running migration 5...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d venuedb -f migrations\005_admin_audit.sql

echo Running migration 6...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d venuedb -f migrations\006_super_admin_role.sql

echo Running grants...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d venuedb -f migrations\005_grants_for_app_role.sql

echo Running super admin bootstrap...
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d venuedb -f migrations\007_bootstrap_super_admin.sql

echo Done!