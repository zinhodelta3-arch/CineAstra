"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TicketSelection from "@/components/checkout/TicketSelection";
import { useCart } from "@/components/cart/cart-provider";
import { DEMO_SESSION, validSession } from "@/components/checkout/ticket-state.mjs";

const SESSION_KEY = "cineastra:checkout:session";
const ORDER_KEY = "cineastra:checkout:order";

export default function IngressosPage() {
  const router = useRouter();
  const [session, setSession] = useState(DEMO_SESSION);
  const { addItem } = useCart();

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
    for (const ticket of order.tickets) {
      addItem({
        id: `ticket-${order.session.id}-${ticket.id}`,
        type: "ticket",
        name: ticket.name,
        category: "Ingresso de cinema",
        description: `${order.session.movie.title} • ${order.session.cinema.name}`,
        details: `${order.session.dateLabel} às ${order.session.time} • Assentos: ${order.session.seats.join(", ")}`,
        price: ticket.unitPriceCents / 100,
        image: order.session.movie.poster || "",
      }, ticket.quantity);
    }
    router.push("/carrinho");
  }

  return <TicketSelection key={`${session.id}:${session.seats.join(",")}`} session={session} onBack={() => router.back()} onContinue={handleContinue} />;
}
