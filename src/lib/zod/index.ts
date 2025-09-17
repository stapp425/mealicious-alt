import z from "zod/v4";
import { Unit, units } from "@/lib/types";

export const maxFileSize = {
  amount: 1024 * 1024 * 5,
  label: "5MB"
};

export const IdSchema = z.string({
  error: (issue) => typeof issue.input === "undefined"
    ? "An id is required."
    : "Expected a string, but received an invalid type."
}).nonempty({
  error: "Id cannot be empty."
});

export const UnitSchema = z.custom<Unit["abbreviation"]>((val) => typeof val === "string", {
  error: "Value must not be empty."
}).refine((val) => (
  units.find(({ abbreviation }) => abbreviation == val)
), { error: "Value must be a valid unit." });

export const UrlSchema = z.url({
  error: (issue) => issue.code === "invalid_format"
    ? "URL must be in a valid URL format."
    : "Expected a string, but received an invalid type."
});

export const ImageDataSchema = z.object({
  name: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A file name is required."
      : "Expected a string, but received an invalid type."
  }).regex(/^.*\.(jpeg|jpg|png|webp)$/, {
    abort: true,
    error: "File extension must have a valid image extension."
  }),
  size: z.coerce.number({
    error: (issue) => typeof issue.code === "undefined"
      ? "A file size is required."
      : "Expected a number, but received an invalid type."
  }),
  type: z.string({
    error: (issue) => typeof issue.input === "undefined"
      ? "A file type is required."
      : "Expected a string, but received an invalid type."
  }).regex(/^image\/(jpeg|jpg|png|webp)$/, {
    error: "The file must be a valid image type."
  })
});

export const CountSchema = z.array(z.object({
  count: z.number({
    error: (issue) => typeof issue.input === "undefined"
      ? "A count is required."
      : "Expected a number, but received an invalid type."
  }).nonnegative({
    abort: true,
    error: "Count cannot be negative."
  }).int({
    error: "Count must be an integer."
  })
})).length(1, {
  error: "Count array can only have one element."
}).transform((val) => val[0].count);
