import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Mutafidz PRO — Manajemen Hafalan Al-Qur'an" },
      {
        name: "description",
        content:
          "Mutafidz PRO — aplikasi manajemen santri, murojaah, dan hafalan Al-Qur'an dengan pemutar audio dan kalender.",
      },
      { property: "og:title", content: "Mutafidz PRO" },
      {
        property: "og:description",
        content: "Manajemen santri, murojaah, dan hafalan Al-Qur'an.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#198754" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <iframe
      src="/mutafidz.html"
      title="Mutafidz PRO"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        border: "none",
      }}
    />
  );
}
