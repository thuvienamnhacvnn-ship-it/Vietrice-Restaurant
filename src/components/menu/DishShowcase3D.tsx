'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'

import { cn } from '@/lib/utils'

/** One floating ingredient sprite. `asset` is a transparent PNG today, a .glb tomorrow. */
export type OrbitIngredient = {
  asset: string
  label: string
}

/**
 * Hero dish plate for the Smart Menu detail column, with the floating
 * ingredient cloud from the mockup.
 *
 * Rendering strategy — CSS 3D rather than WebGL:
 *
 * The design assets ship no GLB/GLTF models, only alpha-keyed PNG sprites, so
 * per the spec this layer is built from transparent PNGs on real 3D transforms:
 * each sprite sits at its own `translateZ`, the group carries a `perspective`,
 * and pointer movement drives a sprung `rotateX/rotateY` parallax. That gives
 * genuine depth and mouse parallax at a fraction of the cost of a WebGL canvas,
 * and it stays smooth on mobile.
 *
 * Upgrade path to WebGL: once real GLB/GLTF models exist, add
 * @react-three/fiber v9 + @react-three/drei v10 (the versions that support
 * React 19, which is what Next 15's App Router runs) and render the models in a
 * <Canvas> here. The sprite contract below — `asset` plus a placement function —
 * is what a 3D swap would reuse, so nothing outside this file changes.
 *
 * Degradation: `prefers-reduced-motion` drops every animation and renders the
 * still plate only.
 */

/** Ellipse placement + depth for each sprite, deterministic per index. */
function layout(i: number, total: number) {
  const angle = (i / Math.max(total, 1)) * Math.PI * 2 - Math.PI / 2
  const rx = 40
  const ry = 34
  return {
    left: 50 + Math.cos(angle) * rx,
    top: 47 + Math.sin(angle) * ry,
    /** Alternating depth so the cloud reads as volume, not a flat ring. */
    z: ((i % 4) - 1.5) * 34,
    scale: 0.82 + ((i * 37) % 5) * 0.09,
    duration: 5 + (i % 3),
    delay: i * 0.3,
  }
}

export function DishShowcase3D({
  image,
  alt,
  ingredients,
  maxSprites = 10,
  className,
}: {
  image: string
  alt: string
  ingredients: OrbitIngredient[]
  maxSprites?: number
  className?: string
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)
  const [onScreen, setOnScreen] = useState(false)

  // Raw pointer position, normalised to [-0.5, 0.5] over the container.
  const px = useMotionValue(0)
  const py = useMotionValue(0)
  const sx = useSpring(px, { stiffness: 70, damping: 18, mass: 0.6 })
  const sy = useSpring(py, { stiffness: 70, damping: 18, mass: 0.6 })

  const rotateY = useTransform(sx, [-0.5, 0.5], [14, -14])
  const rotateX = useTransform(sy, [-0.5, 0.5], [-11, 11])
  const shiftX = useTransform(sx, [-0.5, 0.5], [26, -26])
  const shiftY = useTransform(sy, [-0.5, 0.5], [16, -16])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Infinite sprite animations are expensive; only run them while the section
  // is actually in view. On the home page this section sits below three others.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setOnScreen(entry.isIntersecting),
      { rootMargin: '120px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (reducedMotion || !onScreen) return
    const el = wrapRef.current
    if (!el) return

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect()
      px.set((e.clientX - r.left) / r.width - 0.5)
      py.set((e.clientY - r.top) / r.height - 0.5)
    }
    const onLeave = () => {
      px.set(0)
      py.set(0)
    }

    // Listen on window so the parallax responds before the cursor is over the
    // plate, matching the ambient feel of the mockup.
    window.addEventListener('pointermove', onMove, { passive: true })
    el.addEventListener('pointerleave', onLeave)
    return () => {
      window.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [px, py, reducedMotion, onScreen])

  const sprites = ingredients.slice(0, maxSprites)

  return (
    <div ref={wrapRef} className={cn('relative perspective-1000', className)}>
      {/* Warm glow behind the plate, as in the mockup. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_58%_50%,rgba(216,174,99,0.22),transparent_62%)]"
      />

      {/* Plate */}
      <motion.div
        style={reducedMotion ? undefined : { rotateX, rotateY }}
        className="relative mx-auto aspect-square w-full max-w-[520px] preserve-3d"
      >
        <Image
          src={image}
          alt={alt}
          fill
          priority
          sizes="(max-width: 1024px) 90vw, 520px"
          className="rounded-full object-cover shadow-[0_30px_70px_rgba(0,0,0,0.8)]"
        />
      </motion.div>

      {/* Floating ingredient cloud */}
      {!reducedMotion && onScreen && sprites.length > 0 && (
        <motion.div
          aria-hidden
          style={{ x: shiftX, y: shiftY }}
          className="pointer-events-none absolute inset-0 preserve-3d"
        >
          {sprites.map((ing, i) => {
            const l = layout(i, sprites.length)
            return (
              <motion.img
                key={`${ing.asset}-${i}`}
                src={ing.asset}
                alt=""
                loading="lazy"
                className="absolute w-[78px] max-w-[17%] select-none drop-shadow-[0_10px_18px_rgba(0,0,0,0.6)]"
                style={{
                  left: `${l.left}%`,
                  top: `${l.top}%`,
                  translateX: '-50%',
                  translateY: '-50%',
                  translateZ: l.z,
                  scale: l.scale,
                }}
                animate={{
                  y: [0, -14, 0],
                  rotate: [0, i % 2 ? 7 : -7, 0],
                }}
                transition={{
                  duration: l.duration,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: l.delay,
                }}
              />
            )
          })}
        </motion.div>
      )}
    </div>
  )
}
