"use client";

import { motion } from "framer-motion";
import {
  BadgeDollarSign,
  CalendarClock,
  Coins,
  Factory,
  Gift,
  Globe2,
  LockKeyhole,
  Milestone,
  ShieldCheck,
  TrendingUp,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";

const cases = [
  {
    icon: Users,
    mini: "ship",
    title: "Teams & Founders",
    desc: "Lock contributor, founder, and employee allocations with clear release schedules.",
  },
  {
    icon: TrendingUp,
    mini: "growth",
    title: "Investors & Advisors",
    desc: "Give backers predictable unlocks while keeping every vesting term verifiable.",
  },
  {
    icon: Gift,
    mini: "trust",
    title: "Grants & Rewards",
    desc: "Stream ecosystem incentives over time instead of releasing everything at once.",
  },
  {
    icon: Globe2,
    mini: "governance",
    title: "DAOs & Communities",
    desc: "Coordinate transparent distributions for contributors, voters, and community programs.",
  },
];

function MiniIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <Icon size={22} strokeWidth={2.2} aria-hidden="true" />;
}

function MiniMark({ type }: { type: string }) {
  const icons =
    type === "ship"
      ? [Users, LockKeyhole, CalendarClock]
      : type === "growth"
        ? [BadgeDollarSign, TrendingUp, ShieldCheck]
        : type === "trust"
          ? [Gift, Coins, Milestone]
          : [Vote, Globe2, Factory];

  return (
    <div className="flex items-center gap-3 text-black">
      {icons.map((Icon, index) => (
        <MiniIcon key={`${type}-${index}`} icon={Icon} />
      ))}
    </div>
  );
}

export function UseCases() {
  return (
    <section
      id="use-cases"
      className="relative overflow-hidden bg-white px-6 py-24 md:px-10 md:py-32"
    >
      <div className="relative z-10 mx-auto max-w-[1400px]">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.8fr]">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="max-w-[12ch] text-[clamp(44px,5vw,72px)] font-medium leading-[1.04] tracking-normal text-black"
          >
            Built for every allocation.
          </motion.h2>

        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {cases.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.42, delay: 0.16 + i * 0.07 }}
              className="group relative min-h-[360px] overflow-hidden rounded-[32px] bg-[#f4f4f6] p-6"
            >
              <div className="relative flex h-full flex-col">
                <div
                  className="flex h-16 items-center text-zinc-950"
                  aria-hidden="true"
                >
                  <MiniMark type={item.mini} />
                </div>

                <div className="mt-auto">
                  <h3 className="flex min-h-[92px] max-w-[10ch] items-end text-[clamp(30px,3vw,42px)] font-medium leading-none tracking-normal text-zinc-950">
                    {item.title}
                  </h3>
                  <p className="mt-5 min-h-[84px] text-base leading-relaxed text-zinc-600">
                    {item.desc}
                  </p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
