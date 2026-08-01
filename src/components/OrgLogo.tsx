import React from "react";
import { getOrgInitials } from "@/lib/utils";

interface OrgLogoProps {
  orgName: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { outer: "w-8 h-8", text: "text-[10px]" },
  md: { outer: "w-11 h-11", text: "text-xs" },
  lg: { outer: "w-14 h-14", text: "text-sm" },
};

export const OrgLogo: React.FC<OrgLogoProps> = ({ orgName, logoUrl, size = "md" }) => {
  const { outer, text } = sizeMap[size];
  const initials = getOrgInitials(orgName);

  if (logoUrl) {
    return (
      <div className={`${outer} rounded-xl overflow-hidden bg-black border border-white/10 flex items-center justify-center p-0.5 shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt={orgName}
          className="w-full h-full object-contain"
          onError={(e) => {
            const parent = (e.target as HTMLElement).parentElement;
            if (parent) {
              parent.innerHTML = `<span class="font-bold text-neutral-400 ${text}">${initials}</span>`;
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`${outer} rounded-xl bg-surface-elevated border border-surface-border flex items-center justify-center font-bold text-neutral-400 shrink-0 ${text}`}
      title={orgName}
    >
      {initials}
    </div>
  );
};
