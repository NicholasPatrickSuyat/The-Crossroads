import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Crossroads | Nicholas Suyat",
  description:
    "An interactive fantasy developer portfolio by Nicholas Suyat. Explore Hearth Hollow, Mistveil Mountains, and Ashen Reach to discover my background, projects, and services.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#07070b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
