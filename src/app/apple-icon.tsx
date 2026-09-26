import { appIconResponse } from "@/features/pwa/app-icon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iPhone & iPad (iOS rounds the corners itself). */
export default function AppleIcon() {
  return appIconResponse("apple", size.width);
}
