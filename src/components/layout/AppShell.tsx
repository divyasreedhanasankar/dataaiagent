import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { ContextPanel } from "./ContextPanel";

export function AppShell({ children, showContext = true }: { children: ReactNode; showContext?: boolean }) {
  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [contextOpen, setContextOpen] = useState(true);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <div className="hidden shrink-0 lg:block">
        <Sidebar />
      </div>

      <AnimatePresence>
        {mobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSidebar(false)}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 lg:hidden"
            >
              <Sidebar onClose={() => setMobileSidebar(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onOpenSidebar={() => setMobileSidebar(true)}
          onToggleContext={() => setContextOpen((o) => !o)}
        />
        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
          <AnimatePresence>
            {showContext && contextOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 320, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 34 }}
                className="hidden shrink-0 overflow-hidden xl:block"
              >
                <ContextPanel onClose={() => setContextOpen(false)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
