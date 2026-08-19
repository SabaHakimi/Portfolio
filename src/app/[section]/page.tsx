import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SectionPage } from "@/components/section-page";
import {
  getPortfolioSection,
  portfolioSections,
} from "@/lib/portfolio-map";

type SectionRouteProps = {
  params: Promise<{ section: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return portfolioSections.map(({ slug }) => ({ section: slug }));
}

export async function generateMetadata({
  params,
}: SectionRouteProps): Promise<Metadata> {
  const { section: slug } = await params;
  const section = getPortfolioSection(slug);

  if (!section) {
    return {};
  }

  return {
    title: section.title,
    description: section.summary,
  };
}

export default async function PortfolioSectionRoute({
  params,
}: SectionRouteProps) {
  const { section: slug } = await params;
  const section = getPortfolioSection(slug);

  if (!section) {
    notFound();
  }

  return <SectionPage section={section} />;
}
