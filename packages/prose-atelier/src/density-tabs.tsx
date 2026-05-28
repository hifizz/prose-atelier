"use client";

import { useEffect, useState } from "react";

/* DensityTabs is the runtime control for the chat theme's 4-step scale.
   Drop <DensityTabs /> into a chat-theme article (usually right after the
   header) and it will:
     - read the closest `.art-chat` element's current `data-density`
       on mount (so it reflects whatever the frontmatter chose),
     - on click, set `data-density` to the new value, which makes
       every `.art-chat` token override take effect immediately
       without any other plumbing.

   No persistence, no URL state — frontmatter is the source of truth on
   load, the user's clicks override for the current view. The future
   "right-side drawer" can replace this control or extend it without
   touching any rule in article-chat.css. */

const DENSITIES = ["xs", "sm", "md", "lg"] as const;
type Density = (typeof DENSITIES)[number];

const SIZES: Record<Density, string> = {
  xs: "12 px",
  sm: "14 px",
  md: "16 px",
  lg: "18 px",
};

export function DensityTabs({
  label = "字号",
}: {
  label?: string;
}) {
  const [density, setDensity] = useState<Density>("md");

  // On mount, sync from the article root so the active tab matches
  // whatever the frontmatter set. Runs once.
  useEffect(() => {
    const root = document.querySelector(".art-chat");
    const initial = root?.getAttribute("data-density") as Density | null;
    if (initial && (DENSITIES as readonly string[]).includes(initial)) {
      setDensity(initial);
    }
  }, []);

  // Push the chosen density back to the article root.
  useEffect(() => {
    const root = document.querySelector(".art-chat");
    if (root) root.setAttribute("data-density", density);
  }, [density]);

  return (
    <div
      className="art-chat-density-tabs"
      role="radiogroup"
      aria-label={label}
    >
      <div className="art-chat-density-tabs__group">
        {DENSITIES.map((d) => (
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={density === d}
            data-active={density === d || undefined}
            className="art-chat-density-tabs__btn"
            onClick={() => setDensity(d)}
          >
            <span className="art-chat-density-tabs__name">
              {d.toUpperCase()}
            </span>
            <span className="art-chat-density-tabs__size">{SIZES[d]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
