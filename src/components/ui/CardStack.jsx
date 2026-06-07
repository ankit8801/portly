import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Obsidian Card Stack Component
 * Optimized for architectural portfolios.
 */
export function CardStack({
  items,
  initialIndex = 0,
  maxVisible = 5,
  cardWidth = 600,
  cardHeight = 400,
  overlap = 0.5,
  spreadDeg = 30,
  perspectivePx = 1200,
  depthPx = 100,
  tiltXDeg = 10,
  activeLiftPx = 20,
  activeScale = 1.05,
  inactiveScale = 0.95,
  springStiffness = 300,
  springDamping = 30,
  loop = true,
  autoAdvance = true,
  intervalMs = 4000,
  pauseOnHover = true,
  showDots = true,
  className,
  onChangeIndex,
  renderCard,
}) {
  const reduceMotion = useReducedMotion();
  const len = items.length;

  const [active, setActive] = React.useState(() =>
    wrapIndex(initialIndex, len)
  );
  const [hovering, setHovering] = React.useState(false);

  React.useEffect(() => {
    setActive((a) => wrapIndex(a, len));
  }, [len]);

  React.useEffect(() => {
    if (!len) return;
    onChangeIndex?.(active, items[active]);
  }, [active, items, len, onChangeIndex]);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));
  const cardSpacing = Math.max(10, Math.round(cardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;

  const prev = React.useCallback(() => {
    if (!len) return;
    setActive((a) => wrapIndex(a - 1, len));
  }, [len]);

  const next = React.useCallback(() => {
    if (!len) return;
    setActive((a) => wrapIndex(a + 1, len));
  }, [len]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  React.useEffect(() => {
    if (!autoAdvance || reduceMotion || !len || (pauseOnHover && hovering)) return;
    const id = window.setInterval(() => {
      next();
    }, Math.max(1000, intervalMs));
    return () => window.clearInterval(id);
  }, [autoAdvance, intervalMs, hovering, pauseOnHover, reduceMotion, len, next]);

  if (!len) return null;

  return (
    <div
      className={cn("w-full select-none", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="relative w-full flex items-center justify-center outline-none"
        style={{ height: cardHeight + 100 }}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        {/* Spotlight / Glow Effect */}
        <div className="absolute inset-x-0 bottom-10 mx-auto h-40 w-1/2 rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ perspective: `${perspectivePx}px` }}
        >
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, active, len, loop);
              const abs = Math.abs(off);
              if (abs > maxOffset) return null;

              const rotateZ = off * stepDeg;
              const x = off * cardSpacing;
              const y = abs * 5; 
              const z = -abs * depthPx;
              const isActive = off === 0;
              const scale = isActive ? activeScale : inactiveScale;
              const lift = isActive ? -activeLiftPx : 0;
              const rotateX = isActive ? 0 : tiltXDeg;
              const zIndex = 100 - abs;

              return (
                <motion.div
                  key={item.id}
                  className={cn(
                    "absolute rounded-2xl border border-white/5 overflow-hidden shadow-2xl",
                    isActive ? "cursor-grab active:cursor-grabbing ring-1 ring-accent/20" : "cursor-pointer"
                  )}
                  style={{
                    width: cardWidth,
                    height: cardHeight,
                    zIndex,
                    backgroundColor: "#2A1A10", // --color-card-bg
                  }}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{
                    opacity: 1,
                    x,
                    y: y + lift,
                    rotateZ,
                    rotateX,
                    scale,
                    z,
                  }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{
                    type: "spring",
                    stiffness: springStiffness,
                    damping: springDamping,
                  }}
                  onClick={() => isActive ? null : setActive(i)}
                  drag={isActive ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    const threshold = 100;
                    if (info.offset.x > threshold) prev();
                    else if (info.offset.x < -threshold) next();
                  }}
                >
                  {renderCard ? (
                    renderCard(item, { active: isActive })
                  ) : (
                    <ObsidianCard item={item} isActive={isActive} />
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {showDots && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                idx === active ? "w-8 bg-accent" : "w-2 bg-white/10 hover:bg-white/20"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ObsidianCard({ item, isActive }) {
  return (
    <Link 
      to={item.href} 
      className={cn(
        "relative h-full w-full block group transition-all duration-700",
        isActive ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* image */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={item.imageSrc}
          alt={item.title}
          className={cn(
            "h-full w-full object-cover transition-transform duration-1000",
            isActive ? "scale-100 group-hover:scale-105" : "scale-110 opacity-40 grayscale"
          )}
          loading="lazy"
        />
      </div>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0D0704] via-[#0D0704]/40 to-transparent opacity-80" />

      {/* Content */}
      <div className="absolute inset-0 p-8 flex flex-col justify-end">
        <div className="space-y-2">
          <motion.span 
             initial={{ opacity: 0, x: -10 }}
             animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0 }}
             className="font-label text-[10px] uppercase tracking-[0.3em] text-accent block"
          >
            {item.category || 'Architecture'}
          </motion.span>
          <h3 className="font-headline font-bold text-3xl text-primary-text uppercase tracking-tight leading-none">
            {item.title}
          </h3>
          <p className={cn(
            "font-body text-sm text-primary-text/60 max-w-sm transition-opacity duration-500",
            isActive ? "opacity-100" : "opacity-0"
          )}>
            {item.description}
          </p>
        </div>
        
        {isActive && (
          <div className="mt-6 flex items-center gap-2 text-accent group-hover:gap-4 transition-all">
             <span className="font-label text-[10px] uppercase tracking-[0.2em] font-bold">Explore Piece</span>
             <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function wrapIndex(n, len) {
  if (len <= 0) return 0;
  return ((n % len) + len) % len;
}

function signedOffset(i, active, len, loop) {
  const raw = i - active;
  if (!loop || len <= 1) return raw;
  const alt = raw > 0 ? raw - len : raw + len;
  return Math.abs(alt) < Math.abs(raw) ? alt : raw;
}
