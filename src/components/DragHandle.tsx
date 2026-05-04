import React from "react";

function DragHandle() {
  return (
    <div
      className="flex h-8 w-full cursor-grab items-center justify-center active:cursor-grabbing"
      style={{ WebkitAppRegion: "drag" } as React.CSSProperties}
    >
      <div className="h-1 w-10 rounded-full bg-white/20" />
    </div>
  );
}

export default DragHandle;
