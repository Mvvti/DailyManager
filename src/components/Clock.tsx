import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function Clock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const hm = now.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });
  const ss = now.toLocaleTimeString("pl-PL", { second: "2-digit" }).slice(-2);
  const date = now.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="px-4 py-4 text-center">
      <div className="flex items-end justify-center gap-1">
        <span className="tabular-nums text-5xl font-thin text-white/90">{hm}</span>
        <motion.span
          className="mb-1 tabular-nums text-xl font-thin text-white/40"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        >
          {ss}
        </motion.span>
      </div>
      <p className="mt-1 text-xs capitalize text-white/40">{date}</p>
    </div>
  );
}

export default Clock;
