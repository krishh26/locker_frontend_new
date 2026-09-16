/** Unit/Sub Unit cell shared by the evidence create form and the read-only view. */
export function UnitSubUnitTitle({
  code,
  title,
}: {
  code?: string | null;
  title?: string | null;
}) {
  const text = title ?? "";
  const prefix = (code ?? "").trim();
  return (
    <div
      className="line-clamp-3 wrap-break-word text-xs leading-snug text-foreground"
      title={prefix ? `${prefix}: ${text}` : text}
    >
      {prefix && <strong>{prefix}: </strong>}
      {text}
    </div>
  );
}
