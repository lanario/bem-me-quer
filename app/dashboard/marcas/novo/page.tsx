import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { BrandForm } from "../BrandForm";

export default function NovaMarcaPage() {
  return (
    <div className="p-8">
      <Link
        href="/dashboard/marcas"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova marca</h1>
      <BrandForm />
    </div>
  );
}
