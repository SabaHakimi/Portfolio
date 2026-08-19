import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PortfolioShell } from "@/components/portfolio-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Software Engineer Portfolio",
    template: "%s / Software Engineer Portfolio",
  },
  description:
    "A spatially inspired software engineering portfolio for selected work, experience, education, and skills.",
  applicationName: "Software Engineer Portfolio",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <PortfolioShell>{children}</PortfolioShell>
      </body>
    </html>
  );
}
