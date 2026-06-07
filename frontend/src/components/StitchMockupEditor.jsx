import React from "react";
import { COLOR_HEX } from "@/constants/colors";

/**
 * StitchMockupEditor
 * ------------------
 * Pixel-faithful, STATIC reproduction of the Stitch "Mockup Editor" design
 * (.tmp/stitch/mockup-editor.html). This component is presentational only:
 * it renders the editor chrome and wires the cheap, obvious interactivity
 * (active states + passed-in callbacks). Canvas/Fabric, real uploads, colour
 * tinting and publish/save logic are wired in by SellYourArt.js.
 *
 * Styling note: the Stitch design relies on a custom Tailwind theme
 * (accent-blue, surface-container-*, border-light, on-surface, ...). To match
 * exactly WITHOUT depending on tailwind.config, the custom tokens are written
 * as arbitrary-value classes with the literal hex from the Stitch config.
 * Standard zinc / black-alpha classes are kept verbatim.
 *
 * Colours come from the shared `@/constants/colors` map (single source of
 * truth shared with SellYourArt.js).
 */

// Standalone-preview fallback (only used when `product` is null), matching the
// Stitch HTML's exact colour list.
const FALLBACK_COLORS = [
  "Black",
  "White",
  "Navy",
  "Bottle Green",
  "Mustard",
  "Charcoal",
  "Stone",
  "Cream",
  "Burgundy",
  "Forest",
];

const hexFor = (name) => {
  const key = (name || "").toLowerCase().trim();
  return COLOR_HEX[key] || "#999999";
};

const VIEW_PILLS = [
  { id: "front", label: "FRONT" },
  { id: "back", label: "BACK" },
  { id: "sleeves", label: "SLEEVES" },
];

const RAIL_ITEMS = [
  { id: "select", icon: "near_me", label: "Select" },
  { id: "text", icon: "title", label: "Text" },
  { id: "graphics", icon: "category", label: "Graphics" },
  { id: "uploads", icon: "upload_file", label: "Uploads" },
  { id: "draw", icon: "gesture", label: "Draw" },
  { id: "templates", icon: "dashboard_customize", label: "Templates" },
];

export default function StitchMockupEditor({
  product,
  selectedColor,
  onColorChange,
  activeView = "front",
  onViewChange,
  availableViews,
  canvasSlot,
  onUploadClick,
  onReset,
  onToggleGuide,
  designStats,
  zoomPct = 55,
  onBack,
  onPublish,
  submitting,
}) {
  const colors =
    product?.colors && product.colors.length > 0 ? product.colors : FALLBACK_COLORS;

  const stats = {
    x: 0,
    y: 0,
    scalePct: 100,
    printSafe: true,
    ...(designStats || {}),
  };

  const views = availableViews || { front: true, back: true, sleeves: true };

  // The left rail has no real selection logic yet — "Uploads" is the default
  // active item per the task contract (Stitch shows Graphics active; we follow
  // the contract's instruction to default the active rail item to Uploads).
  const activeRail = "uploads";

  const breadcrumb = `${product?.category ?? "UC21"} · ${(activeView || "")
    .toUpperCase()} · ${(selectedColor || "").toUpperCase() || "—"} · ${zoomPct}%`;

  return (
    <div className="bg-[#fdf8f8] text-[#1c1b1b] h-screen w-full overflow-hidden flex flex-col font-body antialiased">
      {/* ── TopAppBar ─────────────────────────────────────────────── */}
      <header className="bg-zinc-950/80 backdrop-blur-xl text-zinc-50 border-b border-zinc-800/50 flex justify-between items-center w-full px-6 h-16 shrink-0 relative z-10">
        {/* Back & Meta */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back"
            className="hover:opacity-80 transition-opacity duration-300 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-zinc-50 text-xl">
              arrow_back
            </span>
          </button>
          <div className="h-6 w-px bg-zinc-800/50" />
          <span className="font-['Syne'] uppercase tracking-widest text-sm text-zinc-400">
            {breadcrumb}
          </span>
        </div>

        {/* Center Pills */}
        <nav className="flex items-center space-x-2">
          {VIEW_PILLS.map(({ id, label }) => {
            const isActive = (activeView || "").toLowerCase() === id;
            const disabled = views[id] === false;
            if (disabled) {
              return (
                <button
                  key={id}
                  type="button"
                  disabled
                  title="Add mockup"
                  className="px-4 py-1.5 rounded-full text-zinc-700 font-['Syne'] uppercase tracking-widest text-sm opacity-40 cursor-not-allowed"
                >
                  {label}
                </button>
              );
            }
            return (
              <button
                key={id}
                type="button"
                onClick={() => onViewChange && onViewChange(id)}
                className={
                  isActive
                    ? "px-4 py-1.5 rounded-full border border-zinc-50 bg-zinc-50 text-zinc-950 font-['Syne'] uppercase tracking-widest text-sm"
                    : "px-4 py-1.5 rounded-full text-zinc-500 hover:text-zinc-300 font-['Syne'] uppercase tracking-widest text-sm hover:opacity-80 transition-opacity duration-300"
                }
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center space-x-6">
          <button
            type="button"
            aria-label="Lock design"
            className="hover:opacity-80 transition-opacity duration-300 flex items-center justify-center"
          >
            <span className="material-symbols-outlined text-zinc-50 text-xl">
              lock
            </span>
          </button>
          <button
            type="button"
            onClick={onPublish}
            disabled={submitting}
            className="bg-zinc-50 text-zinc-950 px-6 py-2 rounded-full font-['Syne'] uppercase tracking-widest text-sm hover:opacity-80 transition-opacity duration-300 flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                Publishing
                <span className="material-symbols-outlined ml-2 text-sm animate-spin">
                  progress_activity
                </span>
              </>
            ) : (
              <>
                Publish
                <span className="material-symbols-outlined ml-2 text-sm">
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── Main Workspace ────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative z-0">
        {/* SideNavBar */}
        <aside className="bg-zinc-950/90 backdrop-blur-xl text-zinc-50 border-r border-zinc-800/50 h-full w-20 flex flex-col items-center py-8 gap-8 shrink-0 relative z-20">
          <nav className="flex flex-col gap-6 w-full items-center">
            {RAIL_ITEMS.map(({ id, icon, label }) => {
              const isActive = activeRail === id;
              const onClick = id === "uploads" ? onUploadClick : undefined;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={onClick}
                  className={
                    isActive
                      ? "flex flex-col items-center justify-center w-full py-3 text-zinc-50 border-l-2 border-zinc-50 bg-zinc-900/50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group relative"
                      : "flex flex-col items-center justify-center w-full py-3 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group"
                  }
                >
                  <span className="material-symbols-outlined mb-1 text-[22px]">
                    {icon}
                  </span>
                  <span className="font-['Syne'] text-[10px] uppercase font-bold">
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto flex flex-col gap-6 w-full items-center">
            <button
              type="button"
              onClick={onToggleGuide}
              className="flex flex-col items-center justify-center w-full py-3 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group"
            >
              <span className="material-symbols-outlined mb-1 text-[20px]">
                visibility
              </span>
              <span className="font-['Syne'] text-[10px] uppercase font-bold">
                Guide
              </span>
            </button>
            <button
              type="button"
              onClick={onReset}
              className="flex flex-col items-center justify-center w-full py-3 text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/30 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group"
            >
              <span className="material-symbols-outlined mb-1 text-[20px]">
                refresh
              </span>
              <span className="font-['Syne'] text-[10px] uppercase font-bold">
                Reset
              </span>
            </button>
          </div>
        </aside>

        {/* Secondary Panel (COLORS) */}
        <section className="w-[240px] bg-[#ffffff] border-r border-[#E4E4E7] flex flex-col shrink-0 relative z-10">
          <div className="px-6 py-6 border-b border-[#E4E4E7] shrink-0">
            <h2 className="font-['Syne'] text-[30px] leading-[1.2] font-semibold text-black uppercase">
              COLORS
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {colors.map((name) => {
              const hex = hexFor(name);
              const isActive =
                (selectedColor || "").toLowerCase().trim() ===
                (name || "").toLowerCase().trim();
              // Light swatches get a visible border instead of a coloured glow.
              const isLight = ["#FFFFFF", "#F5F1E8", "#F5F0EB"].includes(
                hex.toUpperCase()
              );
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => onColorChange && onColorChange(name)}
                  className={
                    "w-full flex items-center px-6 py-3 border-b border-[#E4E4E7] hover:bg-[#f1edec] transition-colors group" +
                    (isActive ? " bg-[#f1edec]" : "")
                  }
                >
                  <div
                    className={
                      "w-6 h-6 mr-4 shrink-0 transition-shadow " +
                      (isLight
                        ? "border border-[#E4E4E7] shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                        : isActive
                        ? "border-2 border-black shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
                        : "border border-transparent shadow-[0_2px_10px_rgba(0,0,0,0.2)]")
                    }
                    style={{ backgroundColor: hex }}
                  />
                  <div className="flex flex-col items-start flex-1 text-left">
                    <span
                      className={
                        "font-body text-[16px] leading-tight text-[#1c1b1b]" +
                        (isActive ? " font-medium" : "")
                      }
                    >
                      {name}
                    </span>
                  </div>
                  <span className="font-mono text-[12px] tracking-[0.2em] text-[#78767b] ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hex.toUpperCase()}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Main Canvas Area */}
        <main className="flex-1 bg-[#f7f3f2] relative flex items-center justify-center overflow-auto p-8 z-0">
          {/* Mockup Container */}
          <div className="relative w-full max-w-[582px] aspect-[291/373.6] bg-[#ffffff] shadow-[0_10px_40px_rgba(0,0,0,0.05)] flex items-center justify-center overflow-hidden group cursor-crosshair">
            {canvasSlot != null ? (
              canvasSlot
            ) : (
              <>
                {/* T-Shirt image base (static placeholder until canvas wiring) */}
                <div
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                  style={{
                    backgroundImage:
                      "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA2boRKpDl6ee3JnxPqS71x0aKHdnyY7bq0ENmo7DH7hDvZdQZafPb-G8CQ0hcRE1WEnxAA7MgjqciB8AuJWg1_ncLPzpJyZeBjHkOex8WWGN37udPIgCn1bpXUjdpe7DDW2UokVIhbTVoAOKnTv05T0CEtZw-L9RFQ3fsGFEpxgUWW-VBvtdTnsJuUhPGfi6Z7U8OoL8PfQhk9mu54H_idDjT-2ui7PfpJ4BTxiY3oAK_TP2XSZp4yrhR3rRltZMhE6w1nADqBR5wo')",
                  }}
                />
                {/* Overlay gradient for legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent mix-blend-overlay z-0" />

                {/* Print-safe area / canvas bounds */}
                <div className="absolute w-[48%] h-[60%] top-[22%] left-[26%] border-[1.5px] border-dashed border-[#0047FF]/70 z-10 flex items-center justify-center">
                  {/* Corner brackets */}
                  <div className="absolute -top-[1.5px] -left-[1.5px] w-3 h-3 border-t-[1.5px] border-l-[1.5px] border-[#0047FF]" />
                  <div className="absolute -top-[1.5px] -right-[1.5px] w-3 h-3 border-t-[1.5px] border-r-[1.5px] border-[#0047FF]" />
                  <div className="absolute -bottom-[1.5px] -left-[1.5px] w-3 h-3 border-b-[1.5px] border-l-[1.5px] border-[#0047FF]" />
                  <div className="absolute -bottom-[1.5px] -right-[1.5px] w-3 h-3 border-b-[1.5px] border-r-[1.5px] border-[#0047FF]" />
                  {/* Crosshair */}
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-[#0047FF]/20" />
                  <div className="absolute top-0 left-1/2 w-[1px] h-full bg-[#0047FF]/20" />
                  {/* Placeholder design element */}
                  <div className="font-mono text-[12px] tracking-[0.2em] text-[#1c1b1b]/50 border border-[#1c1b1b]/20 px-8 py-4 bg-white/80 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.05)] transform hover:scale-[1.02] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]">
                    DESIGN
                  </div>
                </div>

                {/* Floating label */}
                <div className="absolute top-4 right-4 bg-white border border-black px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em] text-black shadow-[0_2px_10px_rgba(0,0,0,0.1)] z-20">
                  PRINT AREA · 14&quot; x 17&quot;
                </div>
              </>
            )}
          </div>
        </main>
      </div>

      {/* ── Footer / Bottom Strip ─────────────────────────────────── */}
      <footer className="bg-zinc-950/95 text-zinc-400 font-mono text-[10px] uppercase tracking-tighter border-t border-zinc-800/50 w-full z-50 flex justify-between px-4 py-2 shrink-0">
        <div className="flex items-center space-x-4">
          <span>Drag · Corner handles to resize · Arrow keys to nudge</span>
        </div>
        <div className="flex items-center space-x-6">
          <span className="hover:text-zinc-300 transition-colors cursor-pointer">
            Print Safe: {stats.printSafe ? "ON" : "OFF"}
          </span>
          <span className="hover:text-zinc-300 transition-colors cursor-pointer">
            X: {stats.x}px
          </span>
          <span className="hover:text-zinc-300 transition-colors cursor-pointer">
            Y: {stats.y}px
          </span>
          <span className="hover:text-zinc-300 transition-colors cursor-pointer">
            Scale: {stats.scalePct}%
          </span>
          <span className="text-zinc-50 ml-4">CAESURA SYSTEM v1.0.4</span>
        </div>
      </footer>
    </div>
  );
}
