/** Oʻzbekiston viloyatlari — shablonlardagi Fargʻona o‘rniga yoziladi */
export const UZ_REGIONS = [
  {
    id: "andijon",
    ru: "Андижанский",
    ruFem: "Андижанская",
  },
  {
    id: "buxoro",
    ru: "Бухарский",
    ruFem: "Бухарская",
  },
  {
    id: "fargona",
    ru: "Ферганский",
    ruFem: "Ферганская",
  },
  {
    id: "jizzax",
    ru: "Джизакский",
    ruFem: "Джизакская",
  },
  {
    id: "xorazm",
    ru: "Хорезмский",
    ruFem: "Хорезмская",
  },
  {
    id: "namangan",
    ru: "Наманганский",
    ruFem: "Наманганская",
  },
  {
    id: "navoiy",
    ru: "Навоийский",
    ruFem: "Навоийская",
  },
  {
    id: "qashqadaryo",
    ru: "Кашкадарьинский",
    ruFem: "Кашкадарьинская",
  },
  {
    id: "samarqand",
    ru: "Самаркандский",
    ruFem: "Самаркандская",
  },
  {
    id: "sirdaryo",
    ru: "Сырдарьинский",
    ruFem: "Сырдарьинская",
  },
  {
    id: "surxondaryo",
    ru: "Сурхандарьинский",
    ruFem: "Сурхандарьинская",
  },
  {
    id: "toshkent_viloyat",
    ru: "Ташкентский",
    ruFem: "Ташкентская",
  },
  {
    id: "toshkent_shahar",
    ru: "г. Ташкент",
    ruFem: "г. Ташкент",
  },
  {
    id: "qoraqalpogiston",
    ru: "Республики Каракалпакстан",
    ruFem: "Республика Каракалпакстан",
  },
] as const;

export type RegionId = (typeof UZ_REGIONS)[number]["id"];

export function regionRu(id: string | undefined | null): string | null {
  if (!id) return null;
  return UZ_REGIONS.find((r) => r.id === id)?.ru ?? null;
}

/** Blanka shablonidagi «Ферганская» (ayol jinsi) uchun */
export function regionRuFem(id: string | undefined | null): string | null {
  if (!id) return null;
  return UZ_REGIONS.find((r) => r.id === id)?.ruFem ?? null;
}
