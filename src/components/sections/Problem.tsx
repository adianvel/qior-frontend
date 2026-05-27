"use client";

import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useRef, useState } from "react";

const problems = [
  {
    num: "01",
    title: "Dumping risk",
    desc: "Recipients can sell early, tanking token price and community trust.",
  },
  {
    num: "02",
    title: "No transparency",
    desc: "Opaque allocations and vesting terms create distrust and FUD.",
  },
  {
    num: "03",
    title: "Operational risk",
    desc: "Manual processes lead to errors, delays, and compliance issues.",
  },
];

function ProgressiveWords({
  text,
  progress,
  itemIndex,
  wordOffset,
  totalWords,
  className,
}: {
  text: string;
  progress: MotionValue<number>;
  itemIndex: number;
  wordOffset: number;
  totalWords: number;
  className: string;
}) {
  const words = text.split(" ");
  const itemStart = itemIndex / problems.length;
  const itemEnd = (itemIndex + 1) / problems.length;
  const itemSpan = itemEnd - itemStart;
  const sequenceStart = itemStart + itemSpan * 0.04;
  const sequenceEnd = itemStart + itemSpan * 0.98;
  const wordStep = (sequenceEnd - sequenceStart) / Math.max(totalWords, 1);

  return (
    <span className={`block ${className}`}>
      {words.map((word, index) => {
        const start = sequenceStart + wordStep * (wordOffset + index);
        const end = Math.min(sequenceEnd, start + wordStep * 0.72);
        return (
          <ProgressiveWord
            key={`${word}-${index}`}
            word={word}
            progress={progress}
            range={[start, Math.max(start + 0.001, end)]}
          />
        );
      })}
    </span>
  );
}

function ProgressiveWord({
  word,
  progress,
  range,
}: {
  word: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const color = useTransform(progress, range, ["#a1a1aa", "#18181b"]);

  return (
    <motion.span className="inline-block whitespace-nowrap" style={{ color }}>
      {word}
      {"\u00a0"}
    </motion.span>
  );
}

function ProblemPanel({
  item,
  index,
  progress,
}: {
  item: (typeof problems)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  const titleWordCount = item.title.split(" ").length;
  const descWordCount = item.desc.split(" ").length;
  const totalWords = titleWordCount + descWordCount;

  return (
    <motion.article
      key={item.num}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="absolute inset-0 flex flex-col items-start justify-end pb-16 pt-12 md:items-end md:pb-24"
    >
      <p className="mb-6 font-mono text-sm tracking-[0.24em] text-zinc-400">{item.num}</p>
      <ProgressiveWords
        text={item.title}
        progress={progress}
        itemIndex={index}
        wordOffset={0}
        totalWords={totalWords}
        className="max-w-[12ch] text-[clamp(40px,6.2vw,82px)] font-medium leading-[1] tracking-normal"
      />
      <ProgressiveWords
        text={item.desc}
        progress={progress}
        itemIndex={index}
        wordOffset={titleWordCount}
        totalWords={totalWords}
        className="mt-7 max-w-[36ch] text-lg leading-relaxed md:text-xl"
      />
    </motion.article>
  );
}

export function Problem() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const reduceMotion = useReducedMotion() ?? false;
  const { scrollYProgress } = useScroll({
    target: stageRef,
    offset: ["start start", "end end"],
  });
  const activeProblem = problems[activeIndex];

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const nextIndex = Math.min(problems.length - 1, Math.max(0, Math.floor(latest * problems.length)));
    setActiveIndex((current) => (current === nextIndex ? current : nextIndex));
  });

  return (
    <section
      id="problem"
      className="relative -mt-px"
    >
      <div className="relative z-10 px-6 py-20 md:hidden">
        <h2 className="max-w-[13ch] text-[clamp(38px,13vw,56px)] font-medium leading-[1] tracking-normal text-zinc-900">
          Manual token distribution is risky.
        </h2>

        <div className="mt-16 flex flex-col gap-12">
          {problems.map((item) => (
            <article key={item.num} className="border-t border-zinc-900/10 pt-6">
              <p className="mb-5 font-mono text-sm tracking-[0.24em] text-zinc-500">{item.num}</p>
              <h3 className="text-[clamp(36px,11vw,48px)] font-medium leading-none tracking-normal text-zinc-900">
                {item.title}
              </h3>
              <p className="mt-5 max-w-[32ch] text-lg leading-relaxed text-zinc-600">
                {item.desc}
              </p>
            </article>
          ))}
        </div>
      </div>

      <div ref={stageRef} className="relative hidden h-[110dvh] lg:h-[360dvh] md:block">
        <div className="sticky top-0 h-[100svh] overflow-hidden px-6 py-7 md:px-10 md:py-12">
          <div className="relative z-10 mx-auto grid min-h-[calc(100svh-56px)] max-w-[1400px] content-between gap-6 md:min-h-[calc(100vh-80px)] md:grid-cols-[0.82fr_1.18fr] md:content-stretch md:gap-20">
            <div className="pt-3 md:pt-8">
              <h2 className="max-w-[13ch] text-[clamp(38px,5vw,76px)] font-medium leading-[1] tracking-normal text-zinc-900">
                Manual token distribution is risky.
              </h2>
            </div>

            {reduceMotion ? (
              <div className="flex flex-col gap-12 py-8">
                {problems.map((item) => (
                  <article key={item.num}>
                    <p className="mb-4 font-mono text-sm tracking-[0.24em] text-zinc-400">{item.num}</p>
                    <h3 className="text-4xl font-medium leading-none tracking-normal text-zinc-900">
                      {item.title}
                    </h3>
                    <p className="mt-5 max-w-[34ch] text-lg leading-relaxed text-zinc-500">
                      {item.desc}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="relative min-h-[46svh] overflow-hidden md:min-h-full">
                <AnimatePresence initial={false} mode="wait">
                  <ProblemPanel
                    key={activeProblem.num}
                    item={activeProblem}
                    index={activeIndex}
                    progress={scrollYProgress}
                  />
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="sr-only">
        {problems.map((item) => (
          <p key={item.num}>
            {item.num}. {item.title}. {item.desc}
          </p>
        ))}
      </div>
    </section>
  );
}
