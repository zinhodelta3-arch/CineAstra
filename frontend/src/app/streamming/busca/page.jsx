import { Suspense } from "react";
import { StreamDiscovery, DiscoveryLoading } from "@/components/stream-discovery/stream-discovery";

export const metadata = { title: "Buscar filmes | CineAstra Stream" };
export default function SearchPage() {
  return <Suspense fallback={<DiscoveryLoading />}><StreamDiscovery mode="search" /></Suspense>;
}
