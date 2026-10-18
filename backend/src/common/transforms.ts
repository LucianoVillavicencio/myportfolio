import { Transform } from 'class-transformer';

/**
 * Trims strings and turns blank values into `null`, so optional text fields
 * can be cleared from the admin panel instead of silently keeping old values.
 */
export const EmptyToNull = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });

/** Trims a required string field. */
export const Trim = () =>
  Transform(({ value }) => (typeof value === 'string' ? value.trim() : value));

/** Trims text; null becomes '' so NOT NULL columns never receive null. */
export const TextField = () =>
  Transform(({ value }) =>
    value === null ? '' : typeof value === 'string' ? value.trim() : value,
  );
