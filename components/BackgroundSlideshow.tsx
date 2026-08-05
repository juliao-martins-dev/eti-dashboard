"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cx } from "@/lib/cx";

const FOTO = [
  "/backgrounds/background-1.jpg",
  "/backgrounds/background-2.jpg",
  "/backgrounds/background-3.jpg",
  "/backgrounds/background-4.jpg",
] as const;

/** Cycled by index % 3 so neighbouring slides never drift the same way. */
const KENBURNS = [
  "animate-kenburns-1",
  "animate-kenburns-2",
  "animate-kenburns-3",
] as const;

const INTERVALU = 6000;

/**
 * The school photos behind the login card: a slow crossfade with a Ken Burns
 * drift on whichever slide is showing.
 *
 * Decorative only — every image is `alt=""` and `aria-hidden`, so a screen
 * reader walks straight from the page to the form.
 */
export function BackgroundSlideshow() {
  // Index 0 on the server and on the first client render, so hydration matches.
  const [index, setIndex] = useState(0);
  const kamada = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    let id: ReturnType<typeof setInterval> | undefined;

    const para = () => {
      clearInterval(id);
      id = undefined;
    };
    const komesa = () => {
      if (id) return;
      id = setInterval(() => setIndex((i) => (i + 1) % FOTO.length), INTERVALU);
    };
    // A background tab should not burn through the deck; it picks up where it
    // left off when the tab comes back.
    const vizibilidade = () => (document.hidden ? para() : komesa());

    if (!document.hidden) komesa();
    document.addEventListener("visibilitychange", vizibilidade);
    return () => {
      para();
      document.removeEventListener("visibilitychange", vizibilidade);
    };
  }, []);

  useEffect(() => {
    const el = kamada.current[index];
    if (!el) return;
    // Replay the drift on every activation. A CSS animation only restarts when
    // its name is taken away and given back, and the reflow between the two is
    // what makes the removal stick.
    el.style.animation = "none";
    el.getBoundingClientRect();
    el.style.animation = "";
  }, [index]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {FOTO.map((src, i) => (
        <div
          key={src}
          className={cx(
            "absolute inset-0 transition-opacity duration-[1800ms] ease-out motion-reduce:duration-200",
            i === index ? "opacity-100" : "opacity-0",
          )}
        >
          {/* Oversized so the pan never drags an edge into view. */}
          <div
            ref={(el) => {
              kamada.current[i] = el;
            }}
            className={cx(
              "absolute -inset-[3.5%]",
              KENBURNS[i % KENBURNS.length],
              "motion-reduce:animate-none",
            )}
          >
            <Image
              src={src}
              alt=""
              aria-hidden="true"
              fill
              sizes="100vw"
              priority={i === 0}
              className="object-cover"
            />
          </div>
        </div>
      ))}

      {/* Lifts the card off busy photographs without washing them out. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse at 50% 45%, transparent 30%, rgba(0,0,0,0.5) 100%)",
            "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.3) 48%, rgba(0,0,0,0.12) 100%)",
          ].join(","),
        }}
      />
    </div>
  );
}
