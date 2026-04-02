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

import type { FormField, FormListItem } from "@/store/api/forms/types";
import {
  useGetFormsListQuery,
  useGetFormDetailsQuery,
  useGenerateFormsReportExcelMutation,
} from "@/store/api/forms/formsApi";
import { downloadBlob, generateFormsReportFilename } from "./utils/csv-export";

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

  const [generateExcel] = useGenerateFormsReportExcelMutation();

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

      const res = await generateExcel({
        formId: Number(selectedFormId),
        selectedFields: selectedFields.map((f) => f.id),
      }).unwrap();

      const fallbackFilename = generateFormsReportFilename(selectedForm?.form_name);
      downloadBlob(res.blob, res.filename || fallbackFilename);
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
              {t("reports.actions.exportExcel")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

