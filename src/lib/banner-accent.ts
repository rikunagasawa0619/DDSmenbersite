const presets = {
  sky: {
    label: "スカイ",
    backgroundImage: "linear-gradient(135deg, #dbeafe 0%, #eff6ff 50%, #c7d2fe 100%)",
  },
  amber: {
    label: "アンバー",
    backgroundImage: "linear-gradient(135deg, #fef3c7 0%, #fefce8 50%, #fed7aa 100%)",
  },
  violet: {
    label: "バイオレット",
    backgroundImage: "linear-gradient(135deg, #ddd6fe 0%, #fae8ff 50%, #fecdd3 100%)",
  },
  bronze: {
    label: "ブロンズ",
    backgroundImage: "linear-gradient(135deg, #f5ede1 0%, #f2e4cf 50%, #dcc5aa 100%)",
  },
} as const;

type BannerAccentKey = keyof typeof presets;

const aliases: Record<string, BannerAccentKey> = {
  "from-sky-200 via-blue-100 to-indigo-200": "sky",
  "from-amber-100 via-yellow-100 to-orange-200": "amber",
  "from-violet-200 via-fuchsia-100 to-rose-200": "violet",
  sky: "sky",
  amber: "amber",
  violet: "violet",
  bronze: "bronze",
};

export const bannerAccentOptions = Object.entries(presets).map(([value, preset]) => ({
  value,
  label: preset.label,
}));

export const bannerAccentValues = bannerAccentOptions.map((option) => option.value) as [
  BannerAccentKey,
  ...BannerAccentKey[],
];

export function normalizeBannerAccent(value?: string | null): BannerAccentKey {
  if (!value) {
    return "sky";
  }

  return aliases[value] ?? "sky";
}

export function getBannerAccentStyle(value?: string | null) {
  const key = normalizeBannerAccent(value);
  return {
    key,
    label: presets[key].label,
    backgroundImage: presets[key].backgroundImage,
  };
}
