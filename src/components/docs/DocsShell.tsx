"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronDown,
  Code2,
  GitBranch,
  List,
  Moon,
  PanelLeft,
  Search,
  Sun,
  Wrench,
} from "lucide-react";

export type SidebarLink = { href: string; label: string };
export type SidebarGroup = { title: string; links: SidebarLink[] };
export type TocItem = { href: string; label: string };
export type NavLink = { href: string; label: string };

const THEME_STORAGE_KEY = "qior-docs-theme";

function NavAnchor({ href, label, className }: { href: string; label: string; className: string }) {
  if (href.startsWith("/")) {
    return (
      <Link href={href} className={className}>
        {label}
      </Link>
    );
  }

  return (
    <a href={href} className={className}>
      {label}
    </a>
  );
}

export function DocsShell({
  brandLabel,
  sidebarGroups,
  onThisPage,
  githubUrl,
  navLinks,
  children,
}: {
  brandLabel: string;
  sidebarGroups: SidebarGroup[];
  onThisPage: TocItem[];
  githubUrl: string;
  navLinks?: NavLink[];
  children: React.ReactNode;
}) {
  const headerNav = navLinks ?? [
    { href: githubUrl, label: "Github" },
    { href: "/dashboard/creator", label: "Launch App" },
  ];

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    sidebarGroups.reduce<Record<string, boolean>>((groups, group) => {
      groups[group.title] = true;
      return groups;
    }, {}),
  );
  const isDark = theme === "dark";

  useEffect(() => {
    window.requestAnimationFrame(() => {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (storedTheme === "dark") {
        setTheme("dark");
      }
    });
  }, []);

  function setDocsTheme(nextTheme: "light" | "dark") {
    setTheme(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  }

  function toggleGroup(groupTitle: string) {
    setOpenGroups((current) => ({
      ...current,
      [groupTitle]: !current[groupTitle],
    }));
  }

  return (
    <main className={`qior-docs-page ${isDark ? "qior-docs-dark" : ""} min-h-screen bg-[#f7f7f7] text-black`}>
      <aside className={`fixed inset-y-0 left-0 z-20 hidden border-r border-zinc-200 bg-[#f7f7f7] transition-[width] duration-200 lg:block ${sidebarOpen ? "w-[285px]" : "w-[72px]"}`}>
        <div className="flex h-15 items-center justify-between border-b border-zinc-200 px-5">
          <Link href="/" className={`flex min-w-0 items-center gap-3 text-[17px] font-semibold ${sidebarOpen ? "" : "pointer-events-none"}`}>
            <Image
              src="/logo-qior.avif"
              alt="Qior"
              width={82}
              height={28}
              priority
              className="h-8 w-auto"
            />
            {sidebarOpen ? <span className="whitespace-nowrap">{brandLabel}</span> : null}
          </Link>
          <button
            type="button"
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-pressed={!sidebarOpen}
            onClick={() => setSidebarOpen((current) => !current)}
            className="cursor-pointer rounded-md p-1.5 text-zinc-600 hover:bg-zinc-200/70"
          >
            <PanelLeft size={20} />
          </button>
        </div>

        <nav className={`h-[calc(100vh-60px)] overflow-y-auto py-5 ${sidebarOpen ? "px-5" : "px-3"}`}>
          {sidebarGroups.map((group) => (
            <div key={group.title} className="mb-7">
              {sidebarOpen ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="mb-2.5 flex w-full cursor-pointer items-center justify-between rounded-md text-left text-[14px] font-semibold text-black hover:text-zinc-700"
                  aria-expanded={openGroups[group.title]}
                >
                  <span>{group.title}</span>
                  <ChevronDown size={16} className={`text-zinc-500 transition-transform ${openGroups[group.title] ? "" : "-rotate-90"}`} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  aria-label={`Open ${group.title}`}
                  className="mb-5 flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-200/70"
                >
                  <ChevronDown size={16} />
                </button>
              )}
              {sidebarOpen && openGroups[group.title] ? <div className="space-y-1">
                {group.links.map((link, index) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`flex items-center justify-between rounded-md py-1.5 text-[14px] leading-6 transition-colors hover:text-black ${
                      index === 0 ? "font-medium text-black" : "text-zinc-600"
                    }`}
                  >
                    <span className={index > 0 ? "pl-5" : ""}>{link.label}</span>
                  </a>
                ))}
              </div> : null}
            </div>
          ))}
        </nav>
      </aside>

      <div className={`transition-[padding] duration-200 ${sidebarOpen ? "lg:pl-[285px]" : "lg:pl-[72px]"}`}>
        <header className="sticky top-0 z-10 flex h-15 items-center justify-between border-b border-zinc-200 bg-[#f7f7f7]/95 px-5 backdrop-blur md:px-7">
          <div className="flex min-w-0 items-center gap-4">
            <Link href="/" className="flex items-center gap-2 font-semibold lg:hidden">
              <Image
                src="/logo-qior.avif"
                alt="Qior"
                width={72}
                height={24}
                priority
                className="h-7 w-auto"
              />
              {brandLabel}
            </Link>
            <div className="hidden h-9 w-[285px] items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 text-zinc-500 shadow-sm md:flex">
              <Search size={17} />
              <span className="text-[15px]">Search</span>
              <span className="ml-auto rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs text-zinc-500">Ctrl K</span>
            </div>
            <nav className="hidden items-center gap-7 text-[15px] text-zinc-600 md:flex">
              {headerNav.map((link) => (
                <NavAnchor key={link.href} href={link.href} label={link.label} className="hover:text-black" />
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/creator" className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-200/70 md:hidden">
              App
            </Link>
            <div className="flex rounded-full border border-zinc-200 bg-zinc-100 p-1">
              <button
                type="button"
                aria-label="Light theme"
                aria-pressed={!isDark}
                onClick={() => setDocsTheme("light")}
                className={`cursor-pointer rounded-full p-2 transition-colors ${!isDark ? "bg-zinc-200 text-black" : "text-zinc-500 hover:text-black"}`}
              >
                <Sun size={17} />
              </button>
              <button
                type="button"
                aria-label="Dark theme"
                aria-pressed={isDark}
                onClick={() => setDocsTheme("dark")}
                className={`cursor-pointer rounded-full p-2 transition-colors ${isDark ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-black"}`}
              >
                <Moon size={17} />
              </button>
            </div>
          </div>
        </header>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="mx-auto w-full max-w-[880px] px-6 py-10 md:px-11 md:py-12">{children}</article>

          <aside className="hidden border-l border-zinc-200 px-7 py-12 xl:block">
            <div className="sticky top-24">
              <div className="mb-4 flex items-center gap-2 text-[15px] text-zinc-600">
                <List size={17} />
                On this page
              </div>
              <nav className="space-y-3.5 border-l border-zinc-300 pl-5">
                {onThisPage.map((item, index) => (
                  <a key={item.href} href={item.href} className={`block text-[14px] hover:text-black ${index === 0 ? "text-black" : "text-zinc-600"}`}>
                    {item.label}
                  </a>
                ))}
              </nav>
              <a href={githubUrl} className="mt-6 flex items-center gap-3 text-[15px] text-zinc-600 hover:text-black">
                <GitBranch size={19} />
                Edit on GitHub
              </a>
              <Link href="/dashboard/creator" className="mt-6 inline-flex items-center gap-1.5 text-[15px] text-zinc-600 hover:text-black">
                Launch App <ArrowUpRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export function StartCard({ icon, title, desc, href }: { icon: "install" | "integration"; title: string; desc: string; href: string }) {
  const Icon = icon === "install" ? Wrench : Code2;

  return (
    <a href={href} className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300">
      <div className="mb-4 flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-violet-500">
        <Icon size={15} />
      </div>
      <h3 className="text-[15px] font-bold">{title}</h3>
      <p className="mt-2 text-[14px] leading-6 text-zinc-600">{desc}</p>
    </a>
  );
}

export function DocBlock({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-12 scroll-mt-24">
      <h2 className="text-[24px] font-bold tracking-normal">{title}</h2>
      <div className="mt-4 space-y-4 text-[15px] leading-7 text-zinc-700">{children}</div>
    </section>
  );
}

export function Decision({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[16px] font-bold text-black">{title}</h3>
      <p className="mt-2 text-[15px] leading-7 text-zinc-700">{children}</p>
    </div>
  );
}
