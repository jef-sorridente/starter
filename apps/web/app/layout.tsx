import type { Metadata } from "next";
import { Poppins, JetBrains_Mono } from "next/font/google";
import "@app/ui/src/styles.css";
import { APP_NAME } from "@app/shared";
import { AuthProvider } from "../lib/auth-context";
import { AppQueryProvider } from "../lib/query-provider";

// Fontes servidas pelo próprio Next (next/font) — sem request pro Google
// em runtime e sem FOUC. Trocar aqui e em packages/ui/src/tokens/typography.css.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: APP_NAME, template: `%s · ${APP_NAME}` },
  description: `${APP_NAME}`,
  appleWebApp: { title: APP_NAME },
};

// data-theme="dark": o tema do produto é aplicado globalmente (ver
// packages/ui/src/tokens/theme-dark.css). Pra um produto claro, remova
// o atributo — os tokens base já são a paleta clara.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-theme="dark" className={`${poppins.variable} ${jetBrainsMono.variable}`}>
      <body>
        <AppQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </AppQueryProvider>
      </body>
    </html>
  );
}
