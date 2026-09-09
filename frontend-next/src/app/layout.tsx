import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "AquaGhost Protocol // JIT Liquidity Defense Terminal",
  description: "Non-custodial JIT liquidity defense powered by 1inch Aqua, Chainlink CRE in AWS Nitro TEE, and Uniswap v4 Hook firewall.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="terminal-shell">
            <Navbar />
            <main>{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
