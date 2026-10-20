import PurchaseHistory from "@/components/purchases/PurchaseHistory";

export const metadata = {
  title: "Minhas compras | CineAstra",
  description: "Seu histórico de ingressos, aluguéis e assinaturas no CineAstra.",
};

export default function MyPurchasesPage() {
  return <PurchaseHistory />;
}
