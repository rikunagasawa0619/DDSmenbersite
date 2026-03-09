import { cookies } from "next/headers";

export const experimentCookieName = "dds-exp-home-hero";

export const homeHeroVariants = ["immersive", "structured"] as const;

export type HomeHeroVariant = (typeof homeHeroVariants)[number];

export async function getHomeHeroVariant(): Promise<HomeHeroVariant> {
  const cookieStore = await cookies();
  const value = cookieStore.get(experimentCookieName)?.value;
  if (value === "immersive" || value === "structured") {
    return value;
  }

  return "immersive";
}
