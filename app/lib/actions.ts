"use server";

//Marcar que todas las funciones que se exportan en este archivo son funciones de servidor y por lo tanto no se ejecuta ni se envian al cliente

import { z } from "zod";
import { Invoice } from "./definitions";
import mysql from "mysql2/promise";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { AuthError } from "next-auth";

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_NAME,
  port: Number(process.env.MYSQL_PORT),
});

//VALIDAcion de los datos del formulario
//zod es una libreria de validacion de datos
//z.object crea un objeto con las propiedades que le pasamos como argumento
const CreateInvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce.number().positive({
    message: "Please enter a valid amount (greater than Zero).",
  }),
  status: z.enum(["paid", "pending"], {
    invalid_type_error: "Please select a status.",
  }),
  date: z.string(),
});

//omit elimina las propiedades que le pasamos como argumento
//en este caso eliminamos las propiedades id y date ya que no son necesarias para crear una nueva factura
const CreateInvoiceFormSchema = CreateInvoiceSchema.omit({
  id: true,
  date: true,
});

const UpdateInvoiceSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: "Please select a customer.",
  }),
  amount: z.coerce.number().positive({
    message: "Please enter a valid amount (greater than Zero).",
  }),
  status: z.enum(["paid", "pending"], {
    invalid_type_error: "Please select a status.",
  }),
  date: z.string(),
});

const UpdateInvoiceFormSchema = CreateInvoiceSchema.omit({
  id: true,
  date: true,
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

export async function createInvoice(prevState: State, formData: FormData) {
  const validatedFields = CreateInvoiceFormSchema.safeParse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  //Transformamos para evitar errores de redondeo
  const amountInCents = validatedFields.success
    ? validatedFields.data.amount * 100
    : 0; // Convert to cents
  const customerId = validatedFields.success
    ? validatedFields.data.customerId
    : null;
  const status = validatedFields.success ? validatedFields.data.status : null;
  //Creamos la fecha de hoy 2023-10-25
  const [date] = new Date().toISOString().split("T");

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please fill in all required fields.",
    };
  }

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

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoiceFormSchema.parse({
    customerId: formData.get("customerId"),
    amount: formData.get("amount"),
    status: formData.get("status"),
  });

  //Transformamos para evitar errores de redondeo
  const amountInCents = amount * 100; // Convert to cents

  try {
    // Realizamos la consulta para actualizar la factura en la base de datos
    await connection.query(
      `
      UPDATE invoices
      SET customer_id = ?, amount = ?, status = ?
      WHERE id = ?
    `,
      [customerId, amountInCents, status, id]
    );
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to update invoice.");
  }

  revalidatePath(`/dashboard/invoices`); //Revalidamos la ruta para que se actualice la cache de la pagina
  redirect("/dashboard/invoices"); //Redirigimos a la pagina de facturas
}

export async function deleteInvoice(id: string) {
  throw new Error("Failed to Delete invoice.");

  try {
    // Realizamos la consulta para eliminar la factura en la base de datos
    await connection.query(`DELETE FROM invoices WHERE id = ?`, [id]);
  } catch (error) {
    console.error("Database Error:", error);
    throw new Error("Failed to delete invoice.");
  }

  revalidatePath(`/dashboard/invoices`); //Revalidamos la ruta para que se actualice la cache de la pagina
}

export async function authenticate(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.cause) {
        case "CredentialsSignin":
          return "Invalid credentials.";
        default:
          return "Something went wrong.";
      }
    }
    throw error;
  }
}
