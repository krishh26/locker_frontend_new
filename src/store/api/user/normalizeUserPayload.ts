import type { User } from "./types"

/** Mirror assigned_centers / assigned_centres so both spellings exist (API inconsistency). */
export function normalizeUserCentreSpellings<T extends User>(data: T): T {
  const out = { ...data } as T & {
    assigned_centres?: User["assigned_centres"]
    assigned_centers?: User["assigned_centers"]
  }
  if (out.assigned_centers != null && out.assigned_centres == null) {
    out.assigned_centres = out.assigned_centers
  }
  if (out.assigned_centres != null && out.assigned_centers == null) {
    out.assigned_centers = out.assigned_centres
  }
  return out as T
}
