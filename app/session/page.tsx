"use client";

import dynamic from "next/dynamic";

const SessionMonitor = dynamic(() => import("@/components/SessionMonitor"), {
  ssr: false,
});

export default function SessionPage() {
  return <SessionMonitor />;
}
