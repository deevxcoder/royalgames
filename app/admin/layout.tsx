import React from "react";
import { AdminLayoutClient } from "./components/AdminLayoutClient";

export const metadata = {
  title: "Royal Games Studio (RGS) - Master Super Admin Portal",
  description: "Enterprise iGaming Remote Gaming Server (RGS) Back-Office, B2B Aggregator Management, Real-Time GGR Settlement & Authoritative Provably Fair Math Controls.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
