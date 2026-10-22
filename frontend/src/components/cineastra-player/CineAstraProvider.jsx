"use client";
import { useRouter } from "next/navigation";
import { VideoProvider } from "./VideoProvider";
export function CineAstraProvider({ children }) {
  const router = useRouter();
  return <VideoProvider navigate={router.push}>{children}</VideoProvider>;
}
