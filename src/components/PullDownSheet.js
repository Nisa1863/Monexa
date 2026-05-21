import { motion, useMotionValue, useDragControls, animate } from "framer-motion";

const EXPANDED = 268;
const HANDLE = 40;

/** Üstten çek: bildirim / denetim merkezi hissi (blur + sürükle) */
export default function PullDownSheet() {
  const minY = -(EXPANDED - HANDLE);
  const maxY = 0;
  const y = useMotionValue(minY);
  const dragControls = useDragControls();

  const onDragEnd = () => {
    const cur = y.get();
    const open = cur > minY / 2;
    animate(y, open ? maxY : minY, { type: "spring", damping: 34, stiffness: 400 });
  };

  return (
    <motion.div
      className="pull-sheet pull-sheet--down"
      style={{ y }}
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragConstraints={{ top: minY, bottom: maxY }}
      dragElastic={0.1}
      onDragEnd={onDragEnd}
      role="region"
      aria-label="Üst panel — bildirimler ve kısayollar"
    >
      <button
        type="button"
        className="pull-sheet__grabber pull-sheet__grabber--down"
        onPointerDown={(e) => dragControls.start(e)}
        aria-label="Paneli aşağı çek"
      />
      <div className="pull-sheet__blur pull-sheet__blur--down">
        <p className="pull-sheet__title">Bildirimler</p>
        <ul className="pull-sheet__list">
          <li className="pull-sheet__row">Hesap özeti güncellendi</li>
          <li className="pull-sheet__row">Risk skorunda küçük değişim</li>
        </ul>
        <p className="pull-sheet__title" style={{ marginTop: 18 }}>
          Hızlı kısayollar
        </p>
        <div className="pull-sheet__tiles">
          <span className="pull-sheet__tile">Wi‑Fi</span>
          <span className="pull-sheet__tile">Pil</span>
          <span className="pull-sheet__tile">Odak</span>
        </div>
      </div>
    </motion.div>
  );
}
