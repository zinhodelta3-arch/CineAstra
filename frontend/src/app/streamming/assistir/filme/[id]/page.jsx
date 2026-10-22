"use client";
import { useParams } from "next/navigation";
import MediaWatchPage from "@/components/cineastra-player/MediaWatchPage";
export default function FilmWatchPage() {
  const { id } = useParams();
  return <MediaWatchPage id={String(id)} type="movie" />;
}
