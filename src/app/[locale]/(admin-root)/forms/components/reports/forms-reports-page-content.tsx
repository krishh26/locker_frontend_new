"use client";

import { useMemo, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";

import type { FormField, FormListItem, FormSubmission } from "@/store/api/forms/types";
import {
  useGetFormsListQuery,
  useGetFormDetailsQuery,
  useLazyGetFormSubmissionsByFormQuery,
} from "@/store/api/forms/formsApi";
import { downloadCSV, escapeCSVField, generateFormsReportFilename } from "./utils/csv-export";

function normalizeFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function FormsReportsPageContent() {
  const t = useTranslations("forms");

  const [formSearch, setFormSearch] = useState("");
  const [selectedFormId, setSelectedFormId] = useState<string>("");
  const [selectedFieldIds, setSelectedFieldIds] = useState<Record<string, boolean>>({});
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: formsListData, isLoading: loadingForms } = useGetFormsListQuery({
    page: 1,
    page_size: 200,
    search_keyword: formSearch,
  });

  const { data: formDetailsData, isLoading: loadingFormDetails } = useGetFormDetailsQuery(
    selectedFormId,
    { skip: !selectedFormId }
  );

  const [fetchSubmissions] = useLazyGetFormSubmissionsByFormQuery();

  const forms = useMemo(() => (formsListData?.data ?? []) as FormListItem[], [formsListData?.data]);
  const selectedForm = useMemo(() => {
    return forms.find((f) => String(f.id) === String(selectedFormId));
  }, [forms, selectedFormId]);

  const fields: FormField[] = useMemo(() => {
    const d = formDetailsData?.data;
    return (d?.form_data ?? d?.fields ?? []) as FormField[];
  }, [formDetailsData]);

  const selectedFields = useMemo(
    () => fields.filter((f) => !!selectedFieldIds[f.id]),
    [fields, selectedFieldIds]
  );

  const toggleField = (fieldId: string, checked: boolean) => {
    setSelectedFieldIds((prev) => ({ ...prev, [fieldId]: checked }));
  };

  const setAllFields = (checked: boolean) => {
    const next: Record<string, boolean> = {};
    for (const f of fields) next[f.id] = checked;
    setSelectedFieldIds(next);
  };

  const handleSelectForm = (formId: string) => {
    setSelectedFormId(formId);
    setSelectedFieldIds({});
    setError(null);
  };

  const buildCsv = (rows: Array<Record<string, unknown>>): string => {
    const fixedHeaders = [
      t("reports.csvHeaders.userName"),
      t("reports.csvHeaders.email"),
      t("reports.csvHeaders.submittedAt"),
    ];
    const dynamicHeaders = selectedFields.map((f) => f.label || f.id);
    const headers = [...fixedHeaders, ...dynamicHeaders];

    const csvRows = rows.map((r) => {
      const base = [
        escapeCSVField(r.user_name),
        escapeCSVField(r.email),
        escapeCSVField(r.submitted_at),
      ];
      const dynamic = selectedFields.map((f) => escapeCSVField(normalizeFieldValue(r[f.id])));
      return [...base, ...dynamic].join(",");
    });

    return [headers.map(escapeCSVField).join(","), ...csvRows].join("\n");
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      setError(null);

      if (!selectedFormId) {
        setError(t("reports.validation.selectForm"));
        return;
      }
      if (!selectedFields.length) {
        setError(t("reports.validation.selectAtLeastOneField"));
        return;
      }

      // Fetch all pages
      const pageSize = 500;
      let page = 1;
      let pages = 1;
      const submissions: FormSubmission[] = [];

      while (page <= pages) {
        const res = await fetchSubmissions({
          formId: selectedFormId,
          page,
          page_size: pageSize,
        }).unwrap();

        submissions.push(...(res.data ?? []));
        pages = res.meta_data?.pages ?? 1;
        page += 1;

        // Safety guard to avoid infinite loops on unexpected meta
        if (pages > 200) {
          throw new Error(t("reports.errors.tooManyPages"));
        }
      }

      if (!submissions.length) {
        setError(t("reports.errors.noSubmissions"));
        return;
      }

      const rows = submissions.map((s) => {
        const formData = (s.form_data ?? {}) as Record<string, unknown>;
        const row: Record<string, unknown> = {
          user_name: s.user?.user_name ?? "",
          email: s.user?.email ?? "",
          submitted_at: s.created_at ?? "",
        };
        for (const f of selectedFields) {
          row[f.id] = formData[f.id] ?? "";
        }
        return row;
      });

      const csv = buildCsv(rows);
      downloadCSV(csv, generateFormsReportFilename(selectedForm?.form_name));
      toast.success(t("reports.toast.exportSuccess"));
    } catch (e: unknown) {
      const err = e as { data?: { error?: string; message?: string }; message?: string };
      const message =
        err?.data?.error || err?.data?.message || err?.message || t("reports.errors.exportFailed");
      setError(message);
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("tabs.reports")}</CardTitle>
          <CardDescription>
            {t("reports.cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="form-search">{t("reports.formSearch.label")}</Label>
              <Input
                id="form-search"
                value={formSearch}
                onChange={(e) => setFormSearch(e.target.value)}
                placeholder={t("reports.formSearch.placeholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="form-select">{t("reports.formSelect.label")}</Label>
              <select
                id="form-select"
                value={selectedFormId}
                onChange={(e) => handleSelectForm(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loadingForms}
              >
                <option value="">{t("reports.formSelect.placeholder")}</option>
                {forms.map((f) => (
                  <option key={String(f.id)} value={String(f.id)}>
                    {f.form_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("reports.fields.title")}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedFormId
                    ? loadingFormDetails
                      ? t("reports.fields.loading")
                      : t("reports.fields.available", { count: fields.length })
                    : t("reports.fields.selectFormHint")}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setAllFields(true)}
                  disabled={!fields.length}
                >
                  {t("reports.actions.selectAll")}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setAllFields(false)}
                  disabled={!fields.length}
                >
                  {t("reports.actions.clear")}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
              {fields.map((f) => (
                <label key={f.id} className="flex items-center gap-2 rounded-md border p-3">
                  <Checkbox
                    checked={!!selectedFieldIds[f.id]}
                    onCheckedChange={(checked) => toggleField(f.id, Boolean(checked))}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{f.label || f.id}</div>
                    <div className="truncate text-xs text-muted-foreground">{f.type}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button
              onClick={handleExport}
              disabled={exporting || loadingFormDetails || !selectedFormId}
              className="w-full sm:w-auto"
            >
              {exporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Download className="mr-2 h-4 w-4" />
              {t("reports.actions.exportCsv")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

