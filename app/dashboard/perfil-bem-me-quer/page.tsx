import { getCompanyProfile } from "@/actions/company-profile";
import { CompanyProfileForm } from "./CompanyProfileForm";

export default async function PerfilBemMeQuerPage() {
  const profile = await getCompanyProfile();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-bmq-dark mb-2">Perfil Bem Me Quer</h1>
      <p className="text-bmq-mid-dark mb-6">
        Dados da empresa exibidos nos PDFs de venda e documentos.
      </p>
      <CompanyProfileForm profile={profile} />
    </div>
  );
}
