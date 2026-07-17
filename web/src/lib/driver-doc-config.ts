export type FieldKind = "text" | "money" | "number" | "date" | "textarea";

export type FieldDef = {
  name: string;
  labelKey: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  upper?: boolean;
};

export type DocTypeConfig = {
  titleKey: string;
  endpoint: string;
  fields: FieldDef[];
};

const MONEY_FIELDS: FieldDef[] = [
  { name: "price", labelKey: "resource.price", kind: "money", required: true },
  { name: "paid", labelKey: "resource.paid", kind: "money" },
];

const DATE_FIELDS: FieldDef[] = [
  { name: "startDate", labelKey: "resource.startDate", kind: "date" },
  { name: "endDate", labelKey: "resource.endDate", kind: "date" },
];

const NOTE_FIELD: FieldDef = {
  name: "note",
  labelKey: "resource.note",
  kind: "textarea",
};

export const DRIVER_DOC_CONFIGS: Record<string, DocTypeConfig> = {
  putyovka: {
    titleKey: "putyovkas.addTitle",
    endpoint: "/admin/putyovkalar",
    fields: [
      {
        name: "trailerNo",
        labelKey: "putyovkas.trailerNo",
        kind: "text",
        upper: true,
        placeholder: "KRONE SD №...",
      },
      { name: "code", labelKey: "putyovkas.code", kind: "text", upper: true },
      ...MONEY_FIELDS,
      { name: "months", labelKey: "resource.months", kind: "number", placeholder: "12" },
      ...DATE_FIELDS,
      NOTE_FIELD,
    ],
  },
  tir: {
    titleKey: "tirs.addTitle",
    endpoint: "/admin/tirlar",
    fields: [
      {
        name: "tirNumber",
        labelKey: "tirs.tirNumber",
        kind: "text",
        upper: true,
        placeholder: "SCHMITZ №...",
      },
      ...MONEY_FIELDS,
      { name: "months", labelKey: "resource.months", kind: "number", placeholder: "12" },
      ...DATE_FIELDS,
      NOTE_FIELD,
    ],
  },
  dazvol: {
    titleKey: "dazvols.addTitle",
    endpoint: "/admin/dazvollar",
    fields: [
      {
        name: "country",
        labelKey: "dazvols.country",
        kind: "text",
        placeholder: "Rossiya, Germaniya...",
      },
      { name: "dazvolNumber", labelKey: "dazvols.dazvolNumber", kind: "text", upper: true },
      ...MONEY_FIELDS,
      ...DATE_FIELDS,
      NOTE_FIELD,
    ],
  },
  litsenziya: {
    titleKey: "licenses.addTitle",
    endpoint: "/admin/litsenziyalar",
    fields: [
      { name: "licenseNumber", labelKey: "licenses.licenseNumber", kind: "text", upper: true },
      ...MONEY_FIELDS,
      ...DATE_FIELDS,
      NOTE_FIELD,
    ],
  },
  ijara: {
    titleKey: "rentals.addTitle",
    endpoint: "/admin/ijara",
    fields: [
      {
        name: "address",
        labelKey: "rentals.address",
        kind: "text",
        placeholder: "Qo'qon, Mustaqillik ko'chasi 12",
      },
      ...MONEY_FIELDS,
      ...DATE_FIELDS,
      NOTE_FIELD,
    ],
  },
};

export function buildInitialForm(config: DocTypeConfig) {
  const obj: Record<string, string | number> = {};
  for (const f of config.fields) {
    obj[f.name] = f.kind === "money" ? 0 : f.kind === "number" ? 1 : "";
  }
  return obj;
}

export function buildDocBody(
  config: DocTypeConfig,
  form: Record<string, string | number>,
  driverId: string,
) {
  const body: Record<string, unknown> = { driverId };
  for (const f of config.fields) {
    const v = form[f.name];
    if (f.kind === "money") {
      body[f.name] =
        typeof v === "number" ? v : Number(String(v ?? "").replace(/\D/g, "") || 0);
    } else if (f.kind === "number") {
      if (v !== "" && v !== undefined) body[f.name] = Number(v);
    } else if (typeof v === "string" && v.trim()) {
      body[f.name] = v.trim();
    }
  }
  return body;
}
