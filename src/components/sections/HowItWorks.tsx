"use client";

import { motion } from "framer-motion";

const steps = [
  {
    num: "01.",
    title: "Lock",
    desc: "Creator locks tokens in escrow.",
    theme: "bg-[#d8c7ff] text-[#18111f]",
  },
  {
    num: "02.",
    title: "Vest",
    desc: "Smart contract releases over time.",
    theme: "bg-[#0a0a0f] text-[#f8f8fa]",
  },
  {
    num: "03.",
    title: "Claim",
    desc: "Recipients withdraw vested tokens.",
    theme: "bg-[#7c3aed] text-white",
  },
];

function StepGlyph({ index }: { index: number }) {
  if (index === 0) {
    return (
      <svg viewBox="0 0 180 180" fill="none" className="h-32 w-32" aria-hidden="true">
        <path d="M52 84H128V138H52V84Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M66 84V68C66 52.5 76.4 42 90 42C103.6 42 114 52.5 114 68V84" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M75 84V69C75 59 81.2 52 90 52C98.8 52 105 59 105 69V84" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.7" />
        <circle cx="90" cy="109" r="8" stroke="currentColor" strokeWidth="1.6" />
        <path d="M90 117V128" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M52 96H128M64 138L52 154M116 138L128 154" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
        <circle cx="39" cy="94" r="5" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
        <circle cx="141" cy="94" r="5" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
        <path d="M44 94H52M128 94H136" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.55" />
      </svg>
    );
  }

  if (index === 1) {
    return (
      <svg viewBox="0 0 180 180" fill="none" className="h-36 w-36" aria-hidden="true">
        <path d="M38 100H142" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M42 100C56 70 73 70 90 100C107 130 124 130 138 100" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M42 82C56 58 73 58 90 82C107 106 124 106 138 82" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        <path d="M42 118C56 142 73 142 90 118C107 94 124 94 138 118" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.55" />
        {[42, 66, 90, 114, 138].map((x, point) => (
          <g key={x}>
            <circle cx={x} cy="100" r={point === 0 || point === 4 ? 6 : 4.5} stroke="currentColor" strokeWidth="1.5" />
            <path d={`M${x} 128V148`} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
            <path d={`M${x - 8} 148H${x + 8}`} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
          </g>
        ))}
        <path d="M36 54H66M114 54H144" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
        <path d="M72 54H108" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 180 180" fill="none" className="h-36 w-36" aria-hidden="true">
      <path d="M48 106H108C119 106 128 97 128 86V74" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M116 84L128 72L140 84" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M42 118H100C112 118 122 128 122 140V146H66C52.7 146 42 135.3 42 122V118Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M63 118V98C63 90.8 68.8 85 76 85H103C110.2 85 116 90.8 116 98V106" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.62" />
      <circle cx="90" cy="60" r="20" stroke="currentColor" strokeWidth="1.7" />
      <path d="M82 60H98M90 52V68" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="133" cy="42" r="7" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <circle cx="47" cy="66" r="5" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <path d="M53 66H70M110 60H126" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" opacity="0.55" />
    </svg>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-[#f8f8fa] px-4 py-6 md:flex md:min-h-screen md:px-8 md:py-8">
      <div className="mx-auto flex w-full max-w-[1500px] flex-col md:flex-1 md:justify-center">
        <motion.h2
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 text-[clamp(34px,9.2vw,56px)] font-medium leading-[0.96] tracking-normal text-zinc-900 sm:whitespace-nowrap md:mb-10 md:text-[clamp(48px,7vw,120px)]"
        >
          What we do.
        </motion.h2>

        <div className="grid overflow-hidden md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.article
              key={step.num}
              initial={false}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0.12 + i * 0.08 }}
              className={`relative flex min-h-[380px] flex-col justify-between p-8 md:min-h-[460px] md:p-8 ${step.theme}`}
            >
              <div className="flex items-start justify-between gap-8">
                <div className="opacity-95">
                  <StepGlyph index={i} />
                </div>
                <span className="font-mono text-base tracking-[0.12em] opacity-90">{step.num}</span>
              </div>

              <div className="max-w-[28ch]">
                <h3 className="text-[clamp(32px,3vw,48px)] font-medium leading-none tracking-normal">
                  {step.title}
                </h3>
                <p className="mt-6 text-xl leading-snug opacity-95 md:text-2xl">{step.desc}</p>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
