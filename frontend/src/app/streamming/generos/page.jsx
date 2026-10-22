import { Suspense } from "react";
import { StreamDiscovery, DiscoveryLoading } from "@/components/stream-discovery/stream-discovery";

export const metadata = { title: "Gêneros | CineAstra Stream" };
export default function GenresPage() {
  return <Suspense fallback={<DiscoveryLoading />}><StreamDiscovery mode="genres" /></Suspense>;
}
