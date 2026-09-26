import { notFound } from "next/navigation";
import { appIconResponse, type AppIconVariant } from "@/features/pwa/app-icon";

/** PNG icons referenced by the web app manifest (rendered once at build time). */
const APP_ICONS = {
  "icon-192.png": { variant: "any", size: 192 },
  "icon-512.png": { variant: "any", size: 512 },
  "maskable-512.png": { variant: "maskable", size: 512 },
} as const satisfies Record<string, { variant: AppIconVariant; size: number }>;

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(APP_ICONS).map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const icon = APP_ICONS[file as keyof typeof APP_ICONS];
  if (!icon) notFound();
  return appIconResponse(icon.variant, icon.size);
}
