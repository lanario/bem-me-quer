import { getNotaFiscalTemplate } from "@/actions/pdf-templates";
import { NotaFiscalTemplateEditor } from "./NotaFiscalTemplateEditor";

export default async function ModelosPdfPage() {
  const template = await getNotaFiscalTemplate();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-bmq-dark mb-2">Modelos de PDF</h1>
      <p className="text-bmq-mid-dark mb-6">
        Ajuste as cores do template de <span className="font-medium">Nota Fiscal</span>.
      </p>

      <NotaFiscalTemplateEditor initialTemplate={template} />
    </div>
  );
}

