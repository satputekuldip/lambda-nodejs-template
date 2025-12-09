import mysql from "mysql2/promise";
import { Pool as postgresPool } from "pg";

export const ecomDb = mysql.createPool({
	host: process.env.ECOM_DB_HOST,
	user: process.env.ECOM_DB_USERNAME,
	password: process.env.ECOM_DB_PASSWORD,
	database: process.env.ECOM_DB_DATABASE,
	connectionLimit: 1,
});

export const authorsDb = mysql.createPool({
	host: process.env.AT_DB_HOST,
	user: process.env.AT_DB_USERNAME,
	password: process.env.AT_DB_PASSWORD,
	database: process.env.AT_DB_DATABASE,
	connectionLimit: 1,
});

export const accountsDb = new postgresPool({
	host: process.env.ACCOUNTS_DB_HOST,
	user: process.env.ACCOUNTS_DB_USERNAME,
	password: process.env.ACCOUNTS_DB_PASSWORD,
	database: process.env.ACCOUNTS_DB_DATABASE,
	connectionLimit: 1,
});
