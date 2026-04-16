// Constants and types shared between the Page 1 form and its server action.
// Split out of `actions.ts` because Next.js 15 enforces that files marked
// `'use server'` only export async functions.

export const ALLOWED_ROLES = ['PM', 'Developer', 'Designer', 'Evaluator'] as const;
export type Role = (typeof ALLOWED_ROLES)[number];

export const ALLOWED_GENDERS = ['M', 'F', 'U', ''] as const;
export type Gender = (typeof ALLOWED_GENDERS)[number];

export interface BasicInfoState {
  ok: boolean;
  errors?: {
    name?: string;
    roles?: string;
    gender?: string;
  };
}
