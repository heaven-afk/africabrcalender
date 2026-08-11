import React from "react";
import { ArrowUpRight } from "lucide-react";

export const Footer: React.FC = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <div className="site-footer__intro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="site-footer__logo" src="/esports-calendar-logo.png" alt="Esports Calendar" />
        <p>One dependable schedule for competitive gaming across regions and communities.</p>
      </div>
      <div className="site-footer__credits">
        <div><small>Schedule curation</small><a href="https://discord.gg/T99kuZzUF" target="_blank" rel="noopener noreferrer">Fabrizo Mayowa <ArrowUpRight aria-hidden="true" /></a></div>
        <div><small>Built by</small><span><a href="https://getbio.space/heaven" target="_blank" rel="noopener noreferrer">Heaven</a><i>+</i><a href="https://uxdimeji.com" target="_blank" rel="noopener noreferrer">Oladimeji</a></span></div>
        <div><small>From the makers of</small><a href="https://tourneyos.online" target="_blank" rel="noopener noreferrer">TourneyOS <ArrowUpRight aria-hidden="true" /></a></div>
      </div>
    </div>
    <div className="site-footer__base"><span>© {new Date().getFullYear()} Esports Calendar</span><span>Built for the global competitive community.</span></div>
  </footer>
);
