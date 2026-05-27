import { Hero } from "@/components/sections/Hero";
import { Problem } from "@/components/sections/Problem";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Features } from "@/components/sections/Features";
import { ProductPreview } from "@/components/sections/ProductPreview";
import { UseCases } from "@/components/sections/UseCases";
import { ForDevelopers } from "@/components/sections/ForDevelopers";
import { CtaFooter } from "@/components/sections/CtaFooter";

export default function Home() {
  return (
    <main>
      <div className="relative overflow-x-clip bg-[#f8f8fa]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,#d8c7ff_0%,#cbb8ff_46%,#f0e7ff_100%)]" />
        <div className="qior-hero-gradient pointer-events-none absolute inset-x-[-12%] bottom-0 top-[-12%] bg-[radial-gradient(circle_at_12%_32%,rgba(158,117,255,0.55),transparent_34%),radial-gradient(circle_at_78%_16%,rgba(124,58,237,0.48),transparent_32%),radial-gradient(circle_at_70%_72%,rgba(255,255,255,0.62),transparent_30%),radial-gradient(circle_at_42%_54%,rgba(250,245,255,0.56),transparent_30%)]" />
        <div className="qior-hero-blur pointer-events-none absolute inset-x-[-28%] bottom-0 top-[-28%] scale-125 bg-[radial-gradient(circle_at_20%_24%,rgba(255,255,255,0.42),transparent_22%),radial-gradient(circle_at_60%_44%,rgba(139,92,246,0.38),transparent_28%),radial-gradient(circle_at_88%_12%,rgba(109,40,217,0.42),transparent_24%)] blur-[70px]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.13] mix-blend-soft-light bg-[url('data:image/svg+xml,%3Csvg_viewBox=%220_0_256_256%22_xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter_id=%22noise%22%3E%3CfeTurbulence_type=%22fractalNoise%22_baseFrequency=%220.8%22_numOctaves=%224%22_stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect_width=%22256%22_height=%22256%22_filter=%22url(%23noise)%22_opacity=%220.45%22/%3E%3C/svg%3E')]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34dvh] bg-gradient-to-b from-transparent to-[#f8f8fa]" />
        <Hero />
        <Problem />
      </div>
      <HowItWorks />
      <Features />
      <ProductPreview />
      <UseCases />
      <ForDevelopers />
      <CtaFooter />
    </main>
  );
}
