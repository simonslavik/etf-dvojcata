-- Docker Postgres při prvním startu vytvoří navíc DB pro integrační testy API (npm test). Aplikace ji nepoužívá.
CREATE DATABASE etfd_test;
