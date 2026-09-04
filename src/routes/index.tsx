import { createFileRoute } from "@tanstack/react-router";
import { DaftaryApp } from "@/components/daftary/app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <DaftaryApp />;
}
