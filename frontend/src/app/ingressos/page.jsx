"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TicketSelection from "@/components/checkout/TicketSelection";
import { DEMO_SESSION, validSession } from "@/components/checkout/ticket-state.mjs";

// Ajuste somente esta rota para a próxima etapa do seu fluxo.
const NEXT_STEP = "/pagamento";
const SESSION_KEY = "cineastra:checkout:session";
const ORDER_KEY = "cineastra:checkout:order";

export default function IngressosPage() {
  const router = useRouter();
  const [session, setSession] = useState(DEMO_SESSION);

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (validSession(saved)) setSession(saved);
    } catch {
      // Sem dados da etapa anterior, mantém a sessão de demonstração.
    }
  }, []);

  function handleContinue(order) {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(order.session));
      sessionStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch {
      throw new Error("Não foi possível guardar sua seleção neste navegador. Tente novamente.");
    }
    router.push(NEXT_STEP);
  }

  return <TicketSelection key={`${session.id}:${session.seats.join(",")}`} session={session} onBack={() => router.back()} onContinue={handleContinue} />;
}
