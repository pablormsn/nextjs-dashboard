import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_NAME,
});

async function listInvoices() {
  const [rows] = await connection.query(`
    SELECT invoices.amount, customers.name
    FROM invoices
    JOIN customers ON invoices.customer_id = customers.id
    WHERE invoices.amount = 666;
  `);

  return rows;
}

export async function GET() {
  try {
    const data = await listInvoices();
    return new Response(JSON.stringify(data), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error }), { status: 500 });
  } finally {
    await connection.end();
  }
}
