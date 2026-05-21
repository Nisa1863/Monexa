import { useState, useCallback, useLayoutEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence, useDragControls } from "framer-motion";

/* 50px uydular; 30° aralık için R≈110 (merkezler arası ~57px, daire arası boşluklu) */
const ORBIT_R = 110;
const ITEMS = [
  { label: "Yatırım", to: "/invest", deg: 180 },
  { label: "Analiz", to: "/analytics", deg: 210 },
  { label: "Koç", to: "/coach", deg: 240 },
  { label: "Risk modeli", to: "/insights", deg: 270 }
];

function polar(deg) {
  const r = (deg * Math.PI) / 180;
  return {
    x: ORBIT_R * Math.cos(r),
    y: ORBIT_R * Math.sin(r)
  };
}

export default function QuickAccessRadial() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const constraintsRef = useRef(null);
  const dragControls = useDragControls();
  const didDragRef = useRef(false);

  useLayoutEffect(() => {
    const el = document.getElementById("iphone-mockup-screen");
    constraintsRef.current = el;
  }, []);

  return (
    <div className="quick-access">
      <AnimatePresence>
        {open ? (
          <motion.button
            key="qa-bg"
            type="button"
            className="quick-access__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-label="Kapat"
          />
        ) : null}
      </AnimatePresence>

      <motion.div
        className="quick-access__fab"
        drag
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={constraintsRef}
        dragMomentum={false}
        dragElastic={0.06}
        dragTransition={{ bounceStiffness: 400, bounceDamping: 28 }}
        whileDrag={{ cursor: "grabbing" }}
        onDragStart={() => {
          didDragRef.current = true;
        }}
        onDragEnd={(_, info) => {
          const dist = Math.abs(info.offset.x) + Math.abs(info.offset.y);
          didDragRef.current = dist > 6;
          // drag bittiğinde kısa süre sonra click engelini kaldır
          setTimeout(() => {
            didDragRef.current = false;
          }, 180);
        }}
      >
        <div className="quick-access__orbit">
          {ITEMS.map((item, i) => {
            const { x, y } = polar(item.deg);
            return (
              <motion.div
                key={item.to}
                className="quick-access__satellite-wrap"
                initial={false}
                animate={
                  open
                    ? { x, y, opacity: 1, scale: 1 }
                    : { x: 0, y: 0, opacity: 0, scale: 0.4 }
                }
                transition={{ type: "spring", damping: 26, stiffness: 400, delay: open ? i * 0.05 : 0 }}
                style={{ pointerEvents: open ? "auto" : "none" }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <Link
                  to={item.to}
                  className="quick-access__satellite"
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  title={item.label}
                >
                  <span className="quick-access__satellite-text">{item.label}</span>
                </Link>
              </motion.div>
            );
          })}

          <button
            type="button"
            className="quick-access__main"
            onClick={(e) => {
              if (didDragRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              setOpen((o) => !o);
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              // FAB'ı sadece ana butondan sürükletiyoruz; uydu linkleri tıklanırken drag tetiklenmesin.
              dragControls.start(e);
            }}
            aria-expanded={open}
            aria-haspopup="true"
          >
            <span className="quick-access__main-text">{open ? "Kapat" : "Hızlı erişim"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
