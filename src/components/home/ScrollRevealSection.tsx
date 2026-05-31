"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type ScrollRevealSectionProps = {
  children: ReactNode;
  className?: string;
};

/** Fades/slides content in when the section enters the viewport (one block per scroll). */
export function ScrollRevealSection({ children, className = "" }: ScrollRevealSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.22, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className={`flex min-h-[72vh] items-center justify-center px-6 py-20 transition-all duration-700 ease-out motion-reduce:transition-none ${
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      } ${className}`}
    >
      {children}
    </section>
  );
}
