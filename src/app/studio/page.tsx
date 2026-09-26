import type { Metadata } from "next";
import { DreamHouse } from "@/features/house/DreamHouse";

export const metadata: Metadata = { title: "Traumhaus" };

export default function StudioPage() {
  return <DreamHouse />;
}
