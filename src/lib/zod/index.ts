import z from "zod";
import { Unit, units } from "@/lib/types";

export const maxFileSize = {
  amount: 1024 * 1024 * 5,
  label: "5MB"
};

export const IdSchema = z.string({
  required_error: "An ID is required."
}).nonempty({
  message: "ID cannot be empty."
});

export const UnitSchema = z.custom<Unit["abbreviation"]>((val) => (typeof val === "string" && val), {
  message: "Value must not be empty."
}).refine((val) => (
  units.find(({ abbreviation }) => abbreviation == val)
), { message: "Value must be a valid unit." });

export const UrlSchema = z.string({
  required_error: "A URL is required."
}).url({
  message: "URL must be in a valid URL format."
});

export const ImageDataSchema = z.object({
  name: z.string({
    required_error: "A file name is required."
  }).regex(/^.*\.(jpeg|jpg|png|webp)$/, {
    message: "File extension must have a valid image extension."
  }),
  size: z.coerce.number({
    required_error: "A file size is required."
  }).min(1, {
    message: "File size must be greater than 0B."
  }).max(maxFileSize.amount, {
    message: `File size must be at most ${maxFileSize.label}.`
  }),
  type: z.string({
    required_error: "A file type is required."
  }).regex(/^image\/(jpeg|jpg|png|webp)$/, {
    message: "The file must be a valid image type."
  })
});

export const CountSchema = z.array(z.object({
  count: z.number({
    invalid_type_error: "Expected a number, but received an invalid type.",
    required_error: "A count is required."
  }).nonnegative({
    message: "Count cannot be negative."
  })
}));
