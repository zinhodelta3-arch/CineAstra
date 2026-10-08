"use client"

import { useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Popcorn,
  Search,
  ShoppingBag,
  Sparkles,
  Ticket,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "ofertas", label: "Ofertas" },
  { id: "combos", label: "Combos" },
  { id: "promocionais", label: "Promocionais" },
  { id: "pipocas", label: "Pipocas" },
  { id: "bebidas", label: "Bebidas" },
  { id: "doces", label: "Doces" },
]

// Contrato preparado para o catálogo que virá do backend.
// Exemplo futuro:
// { id, name, categoryId, description, price, image, badge }
const U = (id, w = 1800) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=88`

const BANNERS = [
  {
    id: "banner-1",
    eyebrow: "AstraSnack • Pipocas",
    title: "Pipoca em primeiro plano.",
    description: "Quentinha, crocante e em quantidade de sobra para acompanhar a sessão inteira.",
    image: "https://static.wixstatic.com/media/af4e4c_e2bd4ced91e54b40a1c03c37da08d832~mv2.jpg/v1/fill/w_1600,h_900,al_c,q_90/af4e4c_e2bd4ced91e54b40a1c03c37da08d832~mv2.jpg",
  },
  {
    id: "banner-2",
    eyebrow: "AstraSnack • Bebidas",
    title: "Refri gelado para completar o filme.",
    description: "Uma bebida bem gelada, pipoca por perto e a sessão pronta para começar.",
    image: "https://www.tochinavi.net/img/kuchikomi/02/IMG01_a5f61d64d0824a3c41b70371c89b7b9ad9338a16.jpg",
  },
  {
    id: "banner-3",
    eyebrow: "AstraSnack • Doces",
    title: "Um pouco de cor entre uma cena e outra.",
    description: "Balas e guloseimas para deixar cada sessão ainda mais divertida.",
    image: U("photo-1770021999036-53291a3a6596"),
  },
  {
    id: "banner-4",
    eyebrow: "AstraSnack • Combo CineAstra",
    title: "Pipoca, bebida e chocolate. Do jeitinho CineAstra.",
    description: "Um combo completo para levar para a poltrona: pipoca, bebida e doces para compartilhar.",
    image: "/astrasnack/cineastra-combo.webp",
  },
]

// Apenas um item real para validar a experiência de produto/drawer.
// O restante do catálogo será entregue pelo backend posteriormente.
const PRODUCTS = [
  {
    id: "c-1",
    name: "Combo CineAstra Supreme",
    categoryId: "combos",
    category: "Combos",
    description: "1 Pipoca Balde Especial + 2 Refrigerantes 1L + 1 M&M's Gigante.",
    price: 52.9,
    image: U("photo-1585647347384-2593bc35786b", 1200),
    badge: "Mais vendido",
  },
]

const SECTIONS = [
  { id: "ofertas", title: "Ofertas", tone: "cyan", count: 5 },
  { id: "combos", title: "Combos", tone: "lilac", count: 5 },
  { id: "promocionais", title: "Produtos promocionais", tone: "yellow", count: 4 },
]

function CinemaStyles() {
  return (
    <style jsx global>{`
      .astra-grain {
        position: relative;
        isolation: isolate;
      }

      .astra-grain::before {
        content: "";
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 40;
        opacity: .035;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.8'/%3E%3C/svg%3E");
      }

      .astra-perf {
        background-image: radial-gradient(circle at 8px 50%, currentColor 0 3px, transparent 3.5px);
        background-size: 18px 100%;
      }

      .astra-banner {
        position: relative;
        overflow: hidden;
        background:
          radial-gradient(circle at 75% 20%, rgba(250,210,65,.22), transparent 24%),
          linear-gradient(110deg, rgba(124,16,41,.95), rgba(53,51,35,.96) 48%, rgba(151,29,0,.92));
      }

      .astra-banner::before {
        content: "";
        position: absolute;
        inset: 0;
        background: repeating-linear-gradient(115deg, transparent 0 32px, rgba(255,255,255,.035) 33px 34px);
      }

      .astra-banner::after {
        content: "";
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,.38) 100%);
      }

      .astra-ticket {
        position: relative;
        overflow: hidden;
      }

      .astra-ticket::before,
      .astra-ticket::after {
        content: "";
        position: absolute;
        top: 50%;
        width: 20px;
        height: 20px;
        border-radius: 999px;
        background: var(--background);
        transform: translateY(-50%);
      }

      .astra-ticket::before { left: -11px; }
      .astra-ticket::after { right: -11px; }

      .astra-cart-ticket {
        position: relative;
        display: flex;
        overflow: hidden;
        isolation: isolate;
        min-height: 88px;
        background: var(--primary);
        color: var(--primary-foreground);
        border: 0;
        border-radius: 7px;
        box-shadow: 0 12px 28px rgba(53, 51, 35, .18);
      }

      .astra-cart-ticket::before,
      .astra-cart-ticket::after {
        content: "";
        position: absolute;
        top: 50%;
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: var(--background);
        transform: translateY(-50%);
        z-index: 3;
      }

      .astra-cart-ticket::before { left: -12px; }
      .astra-cart-ticket::after { right: -12px; }

      .astra-cart-ticket-main {
        position: relative;
        flex: 1;
        padding: 13px 15px 11px 20px;
        background:
          radial-gradient(circle at 88% 20%, rgba(250,210,65,.18), transparent 28%),
          linear-gradient(135deg, #971D00, #7C1029 58%, #691528);
      }

      .astra-cart-ticket-main::after {
        content: "";
        position: absolute;
        right: -1px;
        top: 10px;
        bottom: 10px;
        border-right: 2px dashed rgba(236,225,220,.72);
      }

      .astra-cart-ticket-stub {
        width: 54px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-left: 1px dashed rgba(236,225,220,.55);
        background: rgba(53,51,35,.16);
      }

      .astra-cart-ticket-stub span {
        writing-mode: vertical-rl;
        transform: rotate(180deg);
        font-size: 8px;
        font-weight: 900;
        letter-spacing: .2em;
        text-transform: uppercase;
        opacity: .9;
      }

      .astra-cart-ticket-edge {
        display: none;
      }

      .astra-card {
        transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
      }

      .astra-card:hover {
        transform: translateY(-4px);
        border-color: color-mix(in oklab, var(--primary) 50%, var(--border));
        box-shadow: 0 16px 36px rgba(0,0,0,.14);
      }
    `}</style>
  )
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="mb-5">
      <div className="mb-1 flex items-center gap-2 text-[11px] font-bold tracking-[.24em] text-primary uppercase">
        <span className="h-px w-7 bg-primary" />
        {eyebrow}
      </div>
      <h2 className="f-display text-3xl font-black tracking-tight md:text-4xl">{title}</h2>
      {description && (
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}

function EmptyProductStrip({ tone, count }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="astra-card group relative min-h-40 overflow-hidden rounded-xl border border-border/70 bg-card/60 p-4"
        >
          <div
            className={[
              "mb-4 aspect-[4/3] rounded-lg border border-dashed border-border/70",
              tone === "cyan" && "bg-cyan-500/10",
              tone === "lilac" && "bg-fuchsia-400/10",
              tone === "yellow" && "bg-primary/10",
            ].filter(Boolean).join(" ")}
          >
            <div className="flex h-full items-center justify-center text-muted-foreground/35">
              <Popcorn className="size-9" />
            </div>
          </div>
          <div className="h-3 w-3/4 rounded bg-muted/70" />
          <div className="mt-2 h-2 w-1/2 rounded bg-muted/50" />
        </div>
      ))}
    </div>
  )
}

function ProductCard({ product, onOpen }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(product)}
      className="astra-card overflow-hidden rounded-xl border border-border/70 bg-card text-left"
    >
      <div className="relative aspect-square bg-muted">
        {product.image ? (
          <img src={product.image} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Popcorn className="size-12 text-muted-foreground/30" />
          </div>
        )}
        {product.badge && (
          <span className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase">
            {product.badge}
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <div className="text-[10px] font-bold tracking-[.18em] text-muted-foreground uppercase">
          {product.category}
        </div>
        <h3 className="font-bold">{product.name}</h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">{product.description}</p>
        <div className="flex items-center justify-between pt-2">
          <span className="font-black">R$ {Number(product.price).toFixed(2).replace(".", ",")}</span>
          <span className="text-xs font-semibold text-primary">Ver detalhes →</span>
        </div>
      </div>
    </button>
  )
}

function BannerCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((value) => (value + 1) % BANNERS.length)
    }, 6500)

    return () => clearInterval(timer)
  }, [])

  const banner = BANNERS[current]

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xl">
      <div className="relative min-h-[420px] md:min-h-[520px]">
        {BANNERS.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-700 ${index === current ? "opacity-100" : "pointer-events-none opacity-0"}`}
          >
            <img
              src={item.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-black/15" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />
          </div>
        ))}

        <div className="astra-perf absolute top-0 right-0 left-0 z-10 h-5 text-white/20" />

        <div className="relative z-10 flex min-h-[420px] items-end p-6 md:min-h-[520px] md:p-10">
          <div className="max-w-2xl text-white">
            <div className="mb-2 text-[10px] font-bold tracking-[.3em] text-primary uppercase">
              {banner.eyebrow}
            </div>
            <h2 className="f-display text-4xl font-black leading-none md:text-6xl">
              {banner.title}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 md:text-base">
              {banner.description}
            </p>
          </div>
        </div>

        <div className="absolute right-4 bottom-4 z-20 flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-white/20 bg-black/35 text-white hover:bg-black/60 hover:text-white"
            onClick={() => setCurrent((value) => (value - 1 + BANNERS.length) % BANNERS.length)}
            aria-label="Banner anterior"
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-white/20 bg-black/35 text-white hover:bg-black/60 hover:text-white"
            onClick={() => setCurrent((value) => (value + 1) % BANNERS.length)}
            aria-label="Próximo banner"
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="absolute bottom-6 left-6 z-20 flex gap-1.5 md:left-10">
          {BANNERS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir para o banner ${index + 1}`}
              onClick={() => setCurrent(index)}
              className={`h-1.5 rounded-full transition-all ${index === current ? "w-8 bg-primary" : "w-2 bg-white/45"}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProductDrawer({ product, open, onOpenChange, quantity, setQuantity, onAdd }) {
  if (!product) return null

  const total = Number(product.price) * quantity

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <div className="flex h-full flex-col">
          <SheetHeader className="border-b border-border/70 p-5 pr-14">
            <div className="text-[10px] font-bold tracking-[.24em] text-primary uppercase">
              AstraSnack
            </div>
            <SheetTitle className="text-2xl font-black">{product.name}</SheetTitle>
            <SheetDescription>{product.category}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto">
            <div className="aspect-square bg-muted">
              {product.image ? (
                <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Popcorn className="size-20 text-muted-foreground/25" />
                </div>
              )}
            </div>

            <div className="space-y-5 p-5">
              <p className="text-sm leading-6 text-muted-foreground">{product.description}</p>

              <div className="astra-ticket border-y border-dashed border-border/80 py-5">
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-[10px] font-bold tracking-[.2em] text-muted-foreground uppercase">
                      Valor unitário
                    </div>
                    <div className="mt-1 text-2xl font-black">
                      R$ {Number(product.price).toFixed(2).replace(".", ",")}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 rounded-full border border-border bg-background p-1">
                    <Button variant="ghost" size="icon-sm" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                      <Minus />
                    </Button>
                    <span className="w-7 text-center text-sm font-bold">{quantity}</span>
                    <Button variant="ghost" size="icon-sm" onClick={() => setQuantity(quantity + 1)}>
                      <Plus />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-border/70 bg-card p-5">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <strong>R$ {total.toFixed(2).replace(".", ",")}</strong>
            </div>
            <Button className="w-full" size="lg" onClick={() => onAdd(product, quantity)}>
              <ShoppingBag className="size-4" />
              Adicionar ao carrinho
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default function AstraSnackPage() {
  const [category, setCategory] = useState("todos")
  const [query, setQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [quantity, setQuantity] = useState(1)
  const [cartCount, setCartCount] = useState(0)

  const filteredProducts = useMemo(() => {
    return PRODUCTS.filter((product) => {
      const categoryMatch = category === "todos" || product.categoryId === category
      const queryMatch =
        !query ||
        product.name?.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase())

      return categoryMatch && queryMatch
    })
  }, [category, query])

  const openProduct = (product) => {
    setSelectedProduct(product)
    setQuantity(1)
    setDrawerOpen(true)
  }

  const addToCart = (_, amount) => {
    setCartCount((current) => current + amount)
    setDrawerOpen(false)
  }

  return (
    <main className="astra-grain min-h-screen bg-background text-foreground selection:bg-[#691528] selection:text-[#FAD241]">
      <CinemaStyles />

      <section className="border-b border-border/70 bg-background">
        <div className="mx-auto max-w-[1600px] px-5 py-6 md:px-8 md:py-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-[10px] font-bold tracking-[.3em] text-primary uppercase">
                <Ticket className="size-3.5" />
                CineAstra • AstraSnack
              </div>
              <h1 className="f-display text-5xl font-black tracking-tight md:text-7xl">
                ASTRASNACK<span className="text-primary">.</span>
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground md:text-base">
                O sabor também faz parte da sessão. Escolha seu snack, monte seu combo e leve a experiência CineAstra para a poltrona.
              </p>
            </div>

            <div className="astra-cart-ticket hidden w-52 shrink-0 sm:flex">
              <div className="astra-cart-ticket-main">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1.5 text-[9px] font-black tracking-[.2em] uppercase">
                    <Ticket className="size-3" />
                    CineAstra
                  </div>
                  <ShoppingBag className="size-4" />
                </div>
                <div className="mt-2 text-[10px] font-bold tracking-[.18em] uppercase opacity-80">
                  Meu carrinho
                </div>
                <div className="mt-0.5 text-2xl font-black">
                  {String(cartCount).padStart(2, "0")} <span className="text-xs font-bold opacity-75">itens</span>
                </div>
              </div>
              <div className="astra-cart-ticket-stub">
                <span>AstraSnack • Ticket</span>
              </div>
            </div>
          </div>

          <BannerCarousel />
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] bg-background px-5 py-6 md:px-8">
        <div className="mb-7 flex flex-col gap-4 border-b border-border/70 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {CATEGORIES.map((item) => (
              <Button
                key={item.id}
                type="button"
                size="sm"
                variant={category === item.id ? "default" : "ghost"}
                onClick={() => setCategory(item.id)}
                className="shrink-0 rounded-full"
              >
                {item.label}
              </Button>
            ))}
          </div>

          <label className="flex h-9 w-full items-center gap-2 rounded-full border border-border bg-card px-3 text-muted-foreground lg:max-w-xs">
            <Search className="size-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filtrar produtos..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
            />
          </label>
        </div>

        <div className="space-y-12">
          {SECTIONS.map((section) => {
            const sectionProducts = filteredProducts.filter((product) => product.categoryId === section.id)

            return (
              <section key={section.id}>
                <SectionHeading
                  eyebrow="AstraSnack"
                  title={section.title}
                  description={
                    PRODUCTS.length
                      ? "Produtos disponíveis no catálogo."
                      : "Espaço reservado para o catálogo que será carregado pelo backend."
                  }
                />

                {sectionProducts.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {sectionProducts.map((product) => (
                      <ProductCard key={product.id} product={product} onOpen={openProduct} />
                    ))}
                  </div>
                ) : (
                  <EmptyProductStrip tone={section.tone} count={section.count} />
                )}
              </section>
            )
          })}

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <SectionHeading
                eyebrow="Catálogo"
                title="Todos os produtos"
                description="A grade completa será alimentada pelo backend do AstraSnack."
              />
              {PRODUCTS.length > 0 && (
                <span className="mb-5 text-xs text-muted-foreground">{filteredProducts.length} itens</span>
              )}
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} onOpen={openProduct} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-background">
                  <Sparkles className="size-6 text-primary" />
                </div>
                <h3 className="f-display text-2xl font-black">Catálogo pronto para receber os produtos.</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                  Nenhum produto real foi cadastrado nesta etapa. Quando o backend entregar os itens, eles aparecerão aqui automaticamente e poderão abrir o drawer lateral de detalhes.
                </p>
              </div>
            )}
          </section>
        </div>
      </section>

      <button
        type="button"
        onClick={() => cartCount > 0 && undefined}
        className="fixed right-5 bottom-5 z-30 flex items-center gap-2 rounded-full border border-primary/40 bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-xl transition-transform hover:-translate-y-1"
      >
        <ShoppingBag className="size-4" />
        Carrinho
        {cartCount > 0 && (
          <span className="flex size-6 items-center justify-center rounded-full bg-background text-xs text-foreground">
            {cartCount}
          </span>
        )}
      </button>

      <ProductDrawer
        product={selectedProduct}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        quantity={quantity}
        setQuantity={setQuantity}
        onAdd={addToCart}
      />
    </main>
  )
}
