import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
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

export function CardStack({
  items,
  initialIndex = 0,
  maxVisible = 5,
  cardWidth = 520,
  cardHeight = 360,
  overlap = 0.48,
  spreadDeg = 48,
  perspectivePx = 1100,
  depthPx = 140,
  tiltXDeg = 12,
  activeLiftPx = 22,
  activeScale = 1.03,
  inactiveScale = 0.94,
  springStiffness = 280,
  springDamping = 28,
  loop = true,
  autoAdvance = false,
  intervalMs = 2800,
  pauseOnHover = true,
  showDots = true,
  className,
  onChangeIndex,
  renderCard,
}) {
  const reduceMotion = useReducedMotion();
  const len = items?.length || 0;

  const [active, setActive] = React.useState(() => wrapIndex(initialIndex, len));
  const [hovering, setHovering] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const actualCardWidth = isMobile ? window.innerWidth * 0.85 : cardWidth;
  const actualCardHeight = isMobile ? actualCardWidth * 1.2 : cardHeight;

  React.useEffect(() => {
    setActive((a) => wrapIndex(a, len));
  }, [len]);

  React.useEffect(() => {
    if (!len) return;
    onChangeIndex?.(active, items[active]);
  }, [active, len, items, onChangeIndex]);

  const maxOffset = Math.max(0, Math.floor(maxVisible / 2));
  const cardSpacing = Math.max(10, Math.round(actualCardWidth * (1 - overlap)));
  const stepDeg = maxOffset > 0 ? spreadDeg / maxOffset : 0;

  const canGoPrev = loop || active > 0;
  const canGoNext = loop || active < len - 1;

  const prev = React.useCallback(() => {
    if (!len || !canGoPrev) return;
    setActive((a) => wrapIndex(a - 1, len));
  }, [canGoPrev, len]);

  const next = React.useCallback(() => {
    if (!len || !canGoNext) return;
    setActive((a) => wrapIndex(a + 1, len));
  }, [canGoNext, len]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  React.useEffect(() => {
    if (!autoAdvance || reduceMotion || !len || (pauseOnHover && hovering)) return;
    const id = window.setInterval(() => {
      if (loop || active < len - 1) next();
    }, Math.max(700, intervalMs));
    return () => window.clearInterval(id);
  }, [autoAdvance, intervalMs, hovering, pauseOnHover, reduceMotion, len, loop, active, next]);

  if (!len) return null;

  const activeItem = items[active];

  return (
    <div
      className={cn("w-full flex flex-col items-center", className)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="relative flex justify-center w-full focus:outline-none"
        style={{ height: Math.max(380, actualCardHeight + 80), maxWidth: '100vw', overflow: 'hidden' }}
        tabIndex={0}
        onKeyDown={onKeyDown}
      >
        <div className="pointer-events-none absolute inset-x-0 top-6 mx-auto h-48 w-[70%] rounded-full bg-black/5 blur-3xl dark:bg-white/5" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 mx-auto h-40 w-[76%] rounded-full bg-black/10 blur-3xl dark:bg-black/30" aria-hidden="true" />

        <div
          className="absolute inset-0 flex items-end justify-center pb-8"
          style={{ perspective: `${perspectivePx}px` }}
        >
          <AnimatePresence initial={false}>
            {items.map((item, i) => {
              const off = signedOffset(i, active, len, loop);
              const abs = Math.abs(off);
              const visible = abs <= maxOffset;

              if (!visible) return null;

              const rotateZ = off * stepDeg;
              const x = off * cardSpacing;
              const y = abs * 10;
              const z = -abs * depthPx;

              const isActive = off === 0;
              const scale = isActive ? activeScale : inactiveScale;
              const lift = isActive ? -activeLiftPx : 0;
              const rotateX = isActive ? 0 : tiltXDeg;
              const zIndex = 100 - abs;

              const dragProps = isActive ? {
                drag: "x",
                dragConstraints: { left: 0, right: 0 },
                dragElastic: 0.18,
                onDragEnd: (_e, info) => {
                  if (reduceMotion) return;
                  const travel = info.offset.x;
                  const v = info.velocity.x;
                  const threshold = Math.min(160, actualCardWidth * 0.22);

                  if (travel > threshold || v > 650) prev();
                  else if (travel < -threshold || v < -650) next();
                },
              } : {};

              return (
                <motion.div
                  key={item.id || i}
                  className={cn(
                    "absolute bottom-0 rounded-3xl border border-white/10 overflow-hidden shadow-2xl",
                    "will-change-transform select-none bg-card-bg",
                    isActive ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                  )}
                  style={{
                    width: actualCardWidth,
                    height: actualCardHeight,
                    zIndex,
                    transformStyle: "preserve-3d",
                  }}
                  initial={reduceMotion ? false : { opacity: 0, y: y + 40, x, rotateZ, rotateX, scale }}
                  animate={{ opacity: 1, x, y: y + lift, rotateZ, rotateX, scale }}
                  transition={{ type: "spring", stiffness: springStiffness, damping: springDamping }}
                  onClick={() => setActive(i)}
                  {...dragProps}
                >
                  <div
                    className="h-full w-full"
                    style={{ transform: `translateZ(${z}px)`, transformStyle: "preserve-3d" }}
                  >
                    {renderCard ? renderCard(item, { active: isActive }) : <DefaultFanCard item={item} active={isActive} />}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      {showDots ? (
        <div className="mt-8 flex items-center justify-center gap-4 z-10 relative">
          <div className="flex items-center gap-3">
            {items.map((it, idx) => {
              const on = idx === active;
              return (
                <button
                  key={it.id || idx}
                  onClick={() => setActive(idx)}
                  className={cn("h-2 rounded-full transition-all duration-300", on ? "bg-accent w-8" : "bg-white/20 hover:bg-white/40 w-2")}
                  aria-label={`Go to ${it.title}`}
                />
              );
            })}
          </div>
          {activeItem?.id ? (
             <Link
               to={activeItem.customUrl || `/projects/${activeItem.id}`}
               className="text-white/50 hover:text-accent transition ml-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/5"
               aria-label="Open project details"
             >
               <span className="material-symbols-outlined text-[18px]">open_in_new</span>
             </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DefaultFanCard({ item, active }) {
  return (
    <div className="relative h-full w-full group">
      <div className="absolute inset-0">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" draggable={false} loading="eager" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-background text-sm text-white/50">
            <span className="material-symbols-outlined text-6xl text-accent/20">palette</span>
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-80" />

      <div className="relative z-10 flex h-full flex-col justify-end p-8">
        <span className="category-pill self-start mb-3 bg-black/40 backdrop-blur-md">{item.category}</span>
        <div className="truncate text-2xl md:text-3xl font-bold text-white uppercase tracking-wider mb-2">
          {item.title}
        </div>
        <AnimatePresence>
          {active && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 text-accent mt-2 overflow-hidden">
              <span className="font-label text-[10px] uppercase tracking-[0.2em]">Drag to swipe</span>
              <span className="material-symbols-outlined text-[14px]">swipe</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {active && (
         <div className="absolute inset-0 border-[3px] border-accent/20 rounded-3xl pointer-events-none transition-colors duration-500" />
      )}
    </div>
  );
}
