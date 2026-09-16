import React from "react";
import { LandingHeader } from "@/components/landing/header";
import { LandingHero } from "@/components/landing/hero";
import { ProblemSolutionSection } from "@/components/landing/problem-solution";
import { HowItWorksSection } from "@/components/landing/how-it-works";
import { FeaturesSection } from "@/components/landing/features";
import { RadarPreviewSection } from "@/components/landing/radar-preview";
import { AIAutomationSection } from "@/components/landing/ai-automation";
import { PricingSection } from "@/components/landing/pricing";
import { FAQSection } from "@/components/landing/faq";
import { LandingFooter } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-foreground">
      <LandingHeader />
      <main className="flex-1">
        <LandingHero />
        <ProblemSolutionSection />
        <HowItWorksSection />
        <FeaturesSection />
        <RadarPreviewSection />
        <AIAutomationSection />
        <PricingSection />
        <FAQSection />
      </main>
      <LandingFooter />
    </div>
  );
}
