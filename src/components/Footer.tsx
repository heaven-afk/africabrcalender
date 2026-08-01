import React from "react";

export const Footer: React.FC = () => (
  <footer className="mt-16 py-6 border-t border-[#1a1a1e]">
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-[11px] text-[#3f3f46]">
      <span>
        Data source: from{" "}
        <span className="text-[#71717a]">Fabrizo Mayowa</span>
      </span>
      <span>
        Built by{" "}
        <span className="text-[#e8a33d]">Heaven</span>
        {" / "}
        <span className="text-[#e8a33d]">Nova Technologies</span>
      </span>
    </div>
  </footer>
);
