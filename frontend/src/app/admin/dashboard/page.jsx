"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Clapperboard,
  LayoutDashboard,
  Package,
  Ticket,
  Wallet,
} from "lucide-react";

import { AppSidebar } from "@/components/app-sidebar";

const usuario = {
  name: "Administrador",
  email: "admin@cineastra.com",
};

const sidebarItems = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Produtos",
    icon: Package,
    children: [
      {
        label: "Todos os produtos",
        href: "/admin/produtos",
      },
      {
        label: "Combos",
        href: "/admin/produtos/combos",
      },
      {
        label: "Insumos",
        href: "/admin/produtos/insumos",
      },
    ],
  },
];

const indicators = [
  {
    label: "Receita do dia",
    value: "R$ 4.280,00",
    description: "Pedidos pagos",
    icon: Wallet,
  },
  {
    label: "Ingressos vendidos",
    value: "128",
    description: "Vendas de hoje",
    icon: Ticket,
  },
  {
    label: "Sessões programadas",
    value: "12",
    description: "Na programação de hoje",
    icon: Clapperboard,
  },
  {
    label: "Produtos cadastrados",
    value: "24",
    description: "Entre combos e insumos",
    icon: Package,
  },
];

const orders = [
  {
    id: "#CA-1048",
    customer: "Mariana Costa",
    description: "2 ingressos · 1 combo",
    time: "14:32",
    total: "R$ 120,90",
    status: "Pago",
  },
  {
    id: "#CA-1047",
    customer: "Pedro Almeida",
    description: "1 ingresso",
    time: "14:25",
    total: "R$ 38,00",
    status: "Pendente",
  },
  {
    id: "#CA-1046",
    customer: "Ana Oliveira",
    description: "2 ingressos",
    time: "14:18",
    total: "R$ 76,00",
    status: "Pago",
  },
  {
    id: "#CA-1045",
    customer: "Lucas Santos",
    description: "1 ingresso · 1 combo",
    time: "14:05",
    total: "R$ 82,90",
    status: "Cancelado",
  },
];

const sessions = [
  {
    title: "O Último Fotograma",
    room: "Sala 01",
    format: "IMAX · Legendado",
    time: "15:00",
    sold: 84,
    capacity: 120,
  },
  {
    title: "Constelação Kira",
    room: "Sala 02",
    format: "3D · Dublado",
    time: "15:30",
    sold: 56,
    capacity: 100,
  },
  {
    title: "Baile das Sombras",
    room: "Sala 03",
    format: "2D · Legendado",
    time: "16:15",
    sold: 32,
    capacity: 80,
  },
];

function OrderStatus({ status }) {
  const styles = {
    Pago: "border-primary/20 bg-primary/10 text-primary",
    Pendente: "border-border bg-muted text-muted-foreground",
    Cancelado:
      "border-destructive/20 bg-destructive/10 text-destructive",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full",
        "border px-2.5 py-1 text-xs font-medium",
        styles[status],
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="size-1.5 rounded-full bg-current"
      />
      {status}
    </span>
  );
}

function DashboardContent() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Visão geral
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Acompanhe as vendas e a programação do CineAstra.
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm">
          <CalendarDays
            aria-hidden="true"
            className="size-4 text-muted-foreground"
          />
          Hoje
        </span>
      </header>

      <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        Prévia do dashboard com dados fictícios para demonstração.
      </p>

      {/* Indicadores */}
      <section aria-label="Resumo do dia">
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {indicators.map(
            ({ label, value, description, icon: Icon }) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-card p-5 text-card-foreground"
              >
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-sm font-medium text-muted-foreground">
                    {label}
                  </dt>

                  <Icon
                    aria-hidden="true"
                    className="size-[18px] shrink-0 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                </div>

                <dd className="mt-4 text-3xl font-semibold tracking-tight tabular-nums">
                  {value}
                </dd>

                <dd className="mt-1 text-xs text-muted-foreground">
                  {description}
                </dd>
              </div>
            )
          )}
        </dl>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Pedidos */}
        <section
          aria-labelledby="recent-orders-title"
          className="min-w-0 overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="border-b border-border px-5 py-5">
            <h2
              id="recent-orders-title"
              className="text-base font-semibold"
            >
              Pedidos recentes
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Últimas movimentações de hoje.
            </p>
          </div>

          <div
            role="region"
            aria-label="Tabela de pedidos recentes"
            tabIndex={0}
            className="
              overflow-x-auto focus-visible:outline-none
              focus-visible:ring-2 focus-visible:ring-inset
              focus-visible:ring-ring
            "
          >
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Pedidos fictícios com cliente, valor e situação.
              </caption>

              <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th
                    scope="col"
                    className="px-5 py-3 font-medium"
                  >
                    Pedido
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-3 text-right font-medium"
                  >
                    Total
                  </th>

                  <th
                    scope="col"
                    className="px-5 py-3 font-medium"
                  >
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="
                      transition-colors hover:bg-muted/30
                      motion-reduce:transition-none
                    "
                  >
                    <th
                      scope="row"
                      className="px-5 py-4 font-normal"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {order.id}
                        </span>

                        <span className="text-xs tabular-nums text-muted-foreground">
                          {order.time}
                        </span>
                      </div>

                      <p className="mt-1 whitespace-nowrap">
                        {order.customer}
                      </p>

                      <p className="mt-0.5 whitespace-nowrap text-xs text-muted-foreground">
                        {order.description}
                      </p>
                    </th>

                    <td className="whitespace-nowrap px-5 py-4 text-right font-medium tabular-nums">
                      {order.total}
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <OrderStatus status={order.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Programação */}
        <section
          aria-labelledby="sessions-title"
          className="min-w-0 overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="border-b border-dashed border-border px-5 py-5">
            <h2
              id="sessions-title"
              className="text-base font-semibold"
            >
              Próximas sessões
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Horários e ocupação das salas.
            </p>
          </div>

          <ul className="divide-y divide-border">
            {sessions.map((session) => {
              const occupancy = Math.round(
                (session.sold / session.capacity) * 100
              );

              return (
                <li
                  key={`${session.room}-${session.time}`}
                  className="px-5 py-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold">
                        {session.title}
                      </h3>

                      <p className="mt-1 text-xs text-muted-foreground">
                        {session.room} · {session.format}
                      </p>
                    </div>

                    <time
                      dateTime={session.time}
                      className="
                        shrink-0 rounded-md bg-primary/10
                        px-2.5 py-1 text-sm font-semibold
                        tabular-nums text-primary
                      "
                    >
                      {session.time}
                    </time>
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 flex justify-between gap-3 text-xs text-muted-foreground">
                      <span>
                        {session.sold} de {session.capacity} lugares
                      </span>

                      <span className="tabular-nums">
                        {occupancy}%
                      </span>
                    </div>

                    <div
                      role="meter"
                      aria-label={`Ocupação de ${session.title}`}
                      aria-valuemin={0}
                      aria-valuemax={session.capacity}
                      aria-valuenow={session.sold}
                      aria-valuetext={`${session.sold} de ${session.capacity} lugares ocupados`}
                      className="h-1.5 overflow-hidden rounded-full bg-muted"
                    >
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <Link
        href="/admin/produtos"
        className="
          flex min-h-16 items-center justify-between gap-4
          rounded-xl border border-dashed border-border px-5 py-4
          text-sm font-medium transition-colors
          hover:border-primary/40 hover:bg-muted/40
          focus-visible:outline-none focus-visible:ring-2
          focus-visible:ring-ring motion-reduce:transition-none
        "
      >
        <span className="flex items-center gap-3">
          <Package
            aria-hidden="true"
            className="size-5 text-primary"
          />
          Gerenciar produtos
        </span>

        <ArrowRight
          aria-hidden="true"
          className="size-4 text-muted-foreground"
        />
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  function handleLogout() {
    alert("O logout será conectado ao backend depois.");
  }

  return (
    <div className="flex min-h-dvh bg-background text-foreground">
      <AppSidebar
        items={sidebarItems}
        user={usuario}
        onLogout={handleLogout}
        className="sticky top-0"
      />

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
        <DashboardContent />
      </main>
    </div>
  );
}