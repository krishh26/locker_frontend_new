import type { WellbeingResource } from "@/store/api/health-wellbeing/types";

function beautifyUrl(url: string): string {
  const loc = url.trim();
  if (!loc) return "—";
  try {
    const u = new URL(loc);
    const host = u.hostname.replace(/^www\./, "");
    const parts = u.pathname.split("/").filter(Boolean);
    if (host === "github.com" && parts.length >= 4 && parts[2] === "pull") {
      return `${parts[0]}/${parts[1]} · PR #${parts[3]}`;
    }
    let path = u.pathname === "/" ? "" : u.pathname;
    if (u.search) path += u.search;
    const suffix = path.length > 48 ? `${path.slice(0, 45)}…` : path;
    return suffix ? `${host}${suffix}` : host;
  } catch {
    return loc.length > 64 ? `${loc.slice(0, 61)}…` : loc;
  }
}

/**
 * Label for tables: uses `resource_name` when it is a normal title; if missing or a raw URL
 * (same as `location` for URL resources), shows a shortened readable form of the URL.
 */
export function formatWellbeingDisplayName(resource: WellbeingResource): string {
  const name = resource.resource_name?.trim();
  const loc = resource.location?.trim();
  const primary = name || loc || "";
  if (!primary) return "—";
  if (/^https?:\/\//i.test(primary)) {
    return beautifyUrl(primary);
  }
  return primary;
}
