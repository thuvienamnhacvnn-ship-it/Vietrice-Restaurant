/**
 * Decorative dining-room floor behind the table map, matching mockup 2.
 *
 * The mockup frames the floor plan with a horizontal plank floor, a wooden rail
 * down each side wall, banquette bench pads set against those rails with small
 * potted herbs between them, and a warm pool of light over the centre of the
 * room. (The reference also has foliage in the corners; it was dropped on
 * request because it crowded the outer tables.)
 *
 * All of it is drawn rather than cropped from the mockup — every part of the
 * mockup's floor already has its tables composited onto it, so any crop would
 * show ghost tables under the real, interactive ones.
 *
 * Purely decorative: the whole layer is `aria-hidden` and non-interactive.
 */

/** Wooden side rail with banquette bench pads and small herb pots. */
function SideRail({ side }: { side: 'left' | 'right' }) {
  const isLeft = side === 'left'
  return (
    <div
      className="absolute inset-y-0 w-[46px] sm:w-[58px]"
      style={isLeft ? { left: 0 } : { right: 0 }}
    >
      {/* Vertical wooden post */}
      <div
        className="absolute inset-y-0 w-[9px] bg-[linear-gradient(90deg,#2a1c11,#5c3f23_45%,#2a1c11)] shadow-[0_0_14px_rgba(0,0,0,0.7)]"
        style={isLeft ? { left: 10 } : { right: 10 }}
      />

      {/* Banquette bench pads set against the rail */}
      {[22, 46, 70].map((topPct) => (
        <div
          key={topPct}
          className="absolute h-[13%] w-[26px] rounded-[5px] border border-[#7a5a35]/60 bg-[linear-gradient(180deg,#6d5535,#3d2e1b)] shadow-[0_4px_12px_rgba(0,0,0,0.6)] sm:w-[32px]"
          style={{ top: `${topPct}%`, ...(isLeft ? { left: 20 } : { right: 20 }) }}
        >
          <span className="absolute inset-x-1 top-1 h-[2px] rounded bg-[#a2825a]/40" />
        </div>
      ))}

      {/* Small potted herbs between the benches */}
      {[37, 61].map((topPct) => (
        <div
          key={topPct}
          className="absolute h-[14px] w-[14px] rounded-full bg-[radial-gradient(circle_at_40%_35%,#4f8a3d,#1e3a17)] opacity-85 shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
          style={{ top: `${topPct}%`, ...(isLeft ? { left: 26 } : { right: 26 }) }}
        />
      ))}
    </div>
  )
}

export function FloorDecor() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {/* Plank floor */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_78%_62%_at_50%_40%,#4a3520,#2a1d12_58%,#120c07_100%)]" />
      <div className="absolute inset-0 opacity-[0.5] bg-[repeating-linear-gradient(0deg,rgba(0,0,0,0.42)_0px,rgba(0,0,0,0.42)_1px,transparent_1px,transparent_34px)]" />
      <div className="absolute inset-0 opacity-[0.22] bg-[repeating-linear-gradient(0deg,rgba(216,174,99,0.16)_0px,rgba(216,174,99,0.16)_1px,transparent_2px,transparent_34px)]" />

      {/* Warm pool of light in the centre, vignette at the edges */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_58%_46%_at_50%_44%,rgba(216,174,99,0.13),transparent_70%)]" />
      <div className="absolute inset-0 shadow-[inset_0_0_120px_60px_rgba(0,0,0,0.72)]" />

      <SideRail side="left" />
      <SideRail side="right" />

      {/* Warm wall wash from the sconces along each rail */}
      <div className="absolute inset-y-0 left-0 w-[120px] bg-[linear-gradient(90deg,rgba(216,174,99,0.10),transparent)]" />
      <div className="absolute inset-y-0 right-0 w-[120px] bg-[linear-gradient(270deg,rgba(216,174,99,0.10),transparent)]" />
    </div>
  )
}
