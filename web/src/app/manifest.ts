import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OOO "MUSFIRA SAVDO TRANS"',
    short_name: "Musfira",
    description: "Haydovchi va hujjatlaringizni bir joyda boshqaring",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#050d16",
    theme_color: "#071525",
    lang: "uz",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/mst-mark-v6.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/mst-v6-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/mst-v6-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/mst-v6-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
