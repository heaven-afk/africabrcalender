import React from "react";
import { ArrowUpRight, Radio } from "lucide-react";

export const Footer: React.FC = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="site-footer__brand"><Radio aria-hidden="true" /><span>ESPORTS CALENDAR</span></div>
      <p>Competitive schedules across games, regions and communities.</p>
      <div className="site-footer__credits">
        <span>Schedule data by Fabrizo Mayowa</span>
        <span>Built by Heaven / Nova Technologies <ArrowUpRight aria-hidden="true" /></span>
      </div>
    </div>
  </footer>
);
