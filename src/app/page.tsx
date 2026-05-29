import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { ProductPreview } from "@/components/sections/ProductPreview";
import { UseCases } from "@/components/sections/UseCases";
import { CtaFooter } from "@/components/sections/CtaFooter";

export default function Home() {
  return (
    <main>
      <div className="relative overflow-x-clip bg-white">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#d8c7ff_0%,#c4b5fd_48%,#f0e7ff_100%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_30%,rgba(139,92,246,0.5),transparent_36%),radial-gradient(circle_at_80%_18%,rgba(124,58,237,0.4),transparent_36%),radial-gradient(circle_at_62%_68%,rgba(255,255,255,0.54),transparent_34%)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34dvh] bg-gradient-to-b from-transparent to-white" />
        <Hero />
        <Problem />
      </div>
      <HowItWorks />
      <ProductPreview />
      <UseCases />
      <CtaFooter />
    </main>
  );
}
