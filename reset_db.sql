-- Complete database reset
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'venuedb' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS venuedb;
CREATE DATABASE venuedb;