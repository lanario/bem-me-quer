import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { ClientForm } from "../ClientForm";

export default function NovoClientePage() {
  return (
    <div className="p-8">
      <Link
        href="/dashboard/clientes"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo cliente</h1>
      <ClientForm />
    </div>
  );
}
