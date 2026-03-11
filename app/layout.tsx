import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bem Me Quer - Gerenciamento de Estoque",
  description: "Sistema de gerenciamento de estoque e vendas",
  icons: {
    icon: "/logo_bmq_transp.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
