import { motion } from "framer-motion";
import { useEffect, useRef } from "react";
import Calendar from "./components/Calendar";
import Clock from "./components/Clock";
import DayNote from "./components/DayNote";
import DragHandle from "./components/DragHandle";
import QuickLinks from "./components/QuickLinks";
import TaskList from "./components/TaskList";
import Weather from "./components/Weather";

const sectionVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } })
};

function App() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      const h = containerRef.current?.getBoundingClientRect().height;
      if (h) window.electronAPI?.resizeWindow(Math.ceil(h));
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="app-envelope flex flex-col gap-3 pb-3">
      <DragHandle />
      {[Clock, Weather, QuickLinks, TaskList, Calendar, DayNote].map((Component, i) => (
        <motion.div
          key={i}
          className="glass-card mx-3"
          custom={i}
          initial="hidden"
          animate="visible"
          variants={sectionVariants}
        >
          <Component />
        </motion.div>
      ))}
    </div>
  );
}

export default App;
