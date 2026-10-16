"use client";

import { useLayoutEffect } from "react";
import {
  APPEARANCE_STORAGE_KEY,
  appearanceValues,
  DEFAULT_APPEARANCE,
} from "@/lib/themes";

export default function AppearanceInitializer() {
  useLayoutEffect(() => {
    let appearance = DEFAULT_APPEARANCE;

    try {
      const saved = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
      if (appearanceValues.includes(saved)) {
        appearance = saved;
      }
    } catch {
      // Mantém a aparência padrão quando o armazenamento está indisponível.
    }

    document.documentElement.dataset.theme = appearance;
  }, []);

  return null;
}
