export const units = [
  {
    name: "calorie",
    pluralName: "calories",
    abbreviation: "kcal"
  },
  {
    name: "gram",
    pluralName: "grams",
    abbreviation: "g"
  },
  {
    name: "milligram",
    pluralName: "milligrams",
    abbreviation: "mg"
  },
  {
    name: "microgram",
    pluralName: "micrograms",
    abbreviation: "μg"
  },
  {
    name: "percent",
    pluralName: "percent",
    abbreviation: "%"
  },
  {
    name: "milliliter",
    pluralName: "milliliters",
    abbreviation: "mL"
  },
  {
    name: "kilogram",
    pluralName: "kilograms",
    abbreviation: "kg"
  },
  {
    name: "pound",
    pluralName: "pounds",
    abbreviation: "lb"
  },
  {
    name: "ounce",
    pluralName: "ounces",
    abbreviation: "oz"
  },
  {
    name: "teaspoon",
    pluralName: "teaspoons",
    abbreviation: "tsp"
  },
  {
    name: "tablespoon",
    pluralName: "tablespoons",
    abbreviation: "tbsp"
  },
  {
    name: "cup",
    pluralName: "cups",
    abbreviation: "cup"
  },
  {
    name: "piece",
    pluralName: "pieces",
    abbreviation: "pc"
  },
  {
    name: "fluid ounce",
    pluralName: "fluid ounces",
    abbreviation: "fl oz"
  },
  {
    name: "pint",
    pluralName: "pints",
    abbreviation: "pt"
  },
  {
    name: "quart",
    pluralName: "quarts",
    abbreviation: "qt"
  },
  {
    name: "gallon",
    pluralName: "gallons",
    abbreviation: "gal"
  },
  {
    name: "liter",
    pluralName: "liters",
    abbreviation: "L"
  }
] as const;

export type Unit = typeof units[number];

export const unitNames = units.map((u) => u.name);
export const unitPluralNames = units.map((u) => u.pluralName);
export const unitAbbreviations = units.map((u) => u.abbreviation);
