import { createFileRoute } from "@tanstack/react-router";
import { MyLocalMasjidMainPage } from "./index";

export const Route = createFileRoute("/my-local-masjid")({
  head: () => ({
    meta: [
      { title: "My Local Masjid — Serving the Community. Strengthening Imaan." },
      {
        name: "description",
        content:
          "Serving the community. Strengthening imaan. Building together. Explore Marriage Database and Masail.",
      },
      { property: "og:title", content: "My Local Masjid" },
      {
        property: "og:description",
        content: "Serving the community. Strengthening imaan. Building together.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og-image.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og-image.png" },
    ],
  }),
  component: MyLocalMasjidMainPage,
});
