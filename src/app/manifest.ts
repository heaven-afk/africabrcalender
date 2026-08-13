import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Esports Calendar",
    short_name: "Esports Calendar",
    description: "Discover and follow esports tournaments, rankings, scrims, awards and broadcasts.",
    start_url: "/",
    display: "standalone",
    background_color: "#050606",
    theme_color: "#4F7CFF",
    icons: [
      { src: "/favicon.png", sizes: "256x256", type: "image/png", purpose: "any" },
      { src: "/favicon.png", sizes: "256x256", type: "image/png", purpose: "maskable" },
    ],
  };
}
