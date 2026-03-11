import Link from "next/link";
import { FiArrowLeft } from "react-icons/fi";
import { CategoryForm } from "../CategoryForm";

export default function NovaCategoriaPage() {
  return (
    <div className="p-8">
      <Link
        href="/dashboard/categorias"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <FiArrowLeft size={18} />
        Voltar
      </Link>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova categoria</h1>
      <CategoryForm />
    </div>
  );
}
