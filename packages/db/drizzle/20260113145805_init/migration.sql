-- Custom SQL migration file, put your code below! --

-- drop the default postgis data
DROP EXTENSION IF EXISTS postgis CASCADE;

-- drop initial tables
DROP SCHEMA IF EXISTS tiger;
DROP SCHEMA IF EXISTS topology;
