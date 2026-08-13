import React from "react";
import { getOrgInitials } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/lib/cloudinary";

interface OrgLogoProps {
  orgName: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: { outer: "w-8 h-8", text: "text-[10px]", px: 64 },
  md: { outer: "w-11 h-11", text: "text-xs", px: 96 },
  lg: { outer: "w-14 h-14", text: "text-sm", px: 128 },
};

export const OrgLogo: React.FC<OrgLogoProps> = ({ orgName, logoUrl, size = "md" }) => {
  const { outer, text, px } = sizeMap[size];
  const initials = getOrgInitials(orgName);
  const optimizedUrl = getOptimizedImageUrl(logoUrl, { width: px, crop: "fit" });

  if (logoUrl) {
    return (
      <div className={`${outer} rounded-lg overflow-hidden bg-[#050606] border border-[#222624] flex items-center justify-center p-1 shrink-0`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={optimizedUrl}
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
      className={`${outer} rounded-lg bg-[#111412] border border-[#373d39] flex items-center justify-center font-bold text-neutral-300 shrink-0 ${text}`}
      title={orgName}
    >
      {initials}
    </div>
  );
};
