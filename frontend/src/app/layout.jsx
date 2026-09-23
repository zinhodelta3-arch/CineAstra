import {
  DM_Sans,
  Geist,
  Geist_Mono,
  IBM_Plex_Mono,
  Lora,
  Plus_Jakarta_Sans,
} from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { ThemeProvider } from "@/components/providers/theme-provider";
import {
  APPEARANCE_STORAGE_KEY,
  appearanceValues,
  DEFAULT_APPEARANCE,
} from "@/lib/themes";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const appearanceScript = `(() => {
  const fallback = ${JSON.stringify(DEFAULT_APPEARANCE)};
  try {
    const saved = localStorage.getItem(${JSON.stringify(APPEARANCE_STORAGE_KEY)});
    const allowed = ${JSON.stringify(appearanceValues)};
    document.documentElement.dataset.theme = allowed.includes(saved) ? saved : fallback;
  } catch {
    document.documentElement.dataset.theme = fallback;
  }
})();`;

export const metadata = {
  title: "CineAstra",
  description: "Sua experiência de cinema começa aqui.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      data-theme={DEFAULT_APPEARANCE}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${plusJakartaSans.variable} ${lora.variable} ${ibmPlexMono.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: appearanceScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <Header />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
