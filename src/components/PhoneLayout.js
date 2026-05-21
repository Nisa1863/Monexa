import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import MobileShell from "./MobileShell";
import Navbar from "./Navbar";

const HIDE_NAV = new Set(["/", "/connect", "/welcome", "/hakkinda", "/forgot-password", "/reset-password"]);
const HIDE_QUICK_ACCESS = new Set(["/", "/welcome", "/hakkinda", "/forgot-password", "/reset-password"]);

export default function PhoneLayout() {
  const location = useLocation();
  const tabBar = HIDE_NAV.has(location.pathname) ? null : <Navbar />;
  const showQuickAccess = !HIDE_QUICK_ACCESS.has(location.pathname);

  return (
    <MobileShell footer={tabBar} showQuickAccess={showQuickAccess} routePath={location.pathname}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, x: 32, filter: "blur(6px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: -28, filter: "blur(4px)" }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="page page--phone"
          style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </MobileShell>
  );
}
