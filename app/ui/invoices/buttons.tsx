"use client";

import { PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { deleteInvoice } from "@/app/lib/actions";
import { useState } from "react";

export function CreateInvoice() {
  return (
    <Link
      href="/dashboard/invoices/create"
      className="flex h-10 items-center rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span className="hidden md:block">Create Invoice</span>{" "}
      <PlusIcon className="h-5 md:ml-4" />
    </Link>
  );
}

export function UpdateInvoice({ id }: { id: string }) {
  return (
    <Link
      href={`/dashboard/invoices/${id}/edit`}
      className="rounded-md border p-2 hover:bg-gray-100"
    >
      <PencilIcon className="w-5" />
    </Link>
  );
}

export function DeleteInvoice({ id }: { id: string }) {
  const [notification, setNotification] = useState<string | null>(null);

  const deleteInvoiceWithId = async () => {
    try {
      await deleteInvoice(id); // Llama a la función para eliminar la factura
      setNotification(`Invoice with ID ${id} has been deleted successfully!`); // Muestra el mensaje en el frontend
    } catch (error) {
      console.error("Failed to delete invoice:", error);
      setNotification("An error occurred while deleting the invoice."); // Muestra un mensaje de error
    }

    // Oculta la notificación después de 3 segundos
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div>
      {notification && (
        <div className="fixed top-4 right-4 rounded-md bg-green-100 p-4 shadow-md">
          <p className="text-sm text-green-800">{notification}</p>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault(); // Evita que el formulario recargue la página
          deleteInvoiceWithId();
        }}
      >
        <button
          type="submit"
          className="rounded-md border p-2 hover:bg-gray-100"
        >
          <span className="sr-only">Delete</span>
          <TrashIcon className="w-5" />
        </button>
      </form>
    </div>
  );
}
