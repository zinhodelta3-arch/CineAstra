"use client";

import { useEffect, useRef } from "react";
import { mountPlayer } from "./player-engine";
import "./player.css";

export default function CineAstraPlayer({ media, onClose }) {
  const host = useRef(null);
  const callbacks = useRef({ onClose });
  callbacks.current = { onClose };

  useEffect(() => {
    if (!media || !host.current) return;
    return mountPlayer(host.current, {
      media,
      onClose: () => callbacks.current.onClose?.(),
    });
  }, [media]);

  return <div ref={host} />;
}
