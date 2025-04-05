"use server";

//Marcar que todas las funciones que se exportan en este archivo son funciones de servidor y por lo tanto no se ejecuta ni se envian al cliente

import { z } from "zod";
import { Invoice } from "./definitions";
import mysql from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_NAME,
});

//VALIDAcion de los datos del formulario
//zod es una libreria de validacion de datos
//z.object crea un objeto con las propiedades que le pasamos como argumento
const CreateInvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  amount: z.coerce.number().positive(),
  status: z.enum(["paid", "pending"]),
  date: z.string(),
});

//omit elimina las propiedades que le pasamos como argumento
//en este caso eliminamos las propiedades id y date ya que no son necesarias para crear una nueva factura
const CreateInvoiceFormSchema = CreateInvoiceSchema.omit({
  id: true,
  date: true,
});

export async function createInvoice(formData: FormData) {
  const { customerId, amount, status } = CreateInvoiceFormSchema.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  //Transformamos para evitar errores de redondeo
  const amountInCents = amount * 100; // Convert to cents
  //Creamos la fecha de hoy 2023-10-25
  const [date] = new Date().toISOString().split("T");

  try {
    // Realizamos la consulta para insertar la factura en la base de datos
    await connection.query(
      `
      INSERT INTO invoices (customer_id, amount, status, date)
      VALUES (?, ?, ?, ?)
    `,
      [customerId, amountInCents, status, date]
    );
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to create invoice.");
  }

  revalidatePath("/dashboard/invoices/create"); //Revalidamos la ruta para que se actualice la cache de la pagina
  redirect("/dashboard/invoices"); //Redirigimos a la pagina de facturas
}
