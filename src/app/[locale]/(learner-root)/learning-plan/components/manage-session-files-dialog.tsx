/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAddFormToLearnerMutation, useGetFormListOfLearnerQuery } from "@/store/api/learner-plan/learnerPlanApi";
import { useGetFormsListQuery } from "@/store/api/forms/formsApi";
import { toast } from "sonner";
import { format } from "date-fns";

/** Defaults: every upload/form goes to All Aims + General Files */
const DEFAULT_WHO = "All Aim";
const DEFAULT_FILE_TYPE = "General Files";

interface ManageSessionFilesDialogProps {
  open: boolean;
  onClose: () => void;
  learnerPlanId: number;
  onSuccess?: () => void;
}

export function ManageSessionFilesDialog({
  open,
  onClose,
  learnerPlanId,
  onSuccess,
}: ManageSessionFilesDialogProps) {
  const t = useTranslations("learningPlan");
  const [uploadMode, setUploadMode] = useState<"File Upload" | "Form Selection">("File Upload");
  const [selectedForm, setSelectedForm] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [addFormToLearner, { isLoading: isAddFormToLearnerLoading }] = useAddFormToLearnerMutation();

  const { data: uploadedDocsData, refetch } = useGetFormListOfLearnerQuery(
    { id: learnerPlanId },
    { skip: !open || !learnerPlanId }
  );

  const { data: formsListData } = useGetFormsListQuery(
    {
      page: 1,
      page_size: 100,
      search_keyword: "",
    },
    { skip: !open }
  );

  const uploadedDocs = useMemo(() => {
    const docs = uploadedDocsData?.data || [];
    return [...docs].sort((a: any, b: any) => {
      const nameA = String(a.name || a.form_name || "").toLowerCase();
      const nameB = String(b.name || b.form_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [uploadedDocsData?.data]);

  const availableForms = useMemo(() => {
    const forms = formsListData?.data || [];
    return [...forms].sort((a: any, b: any) => {
      const nameA = String(a.form_name || "").toLowerCase();
      const nameB = String(b.form_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [formsListData?.data]);

  const handleAddUpload = async () => {
    if (!selectedFile) {
      toast.error(t("dialogs.manageSessionFiles.toast.selectFile"));
      return;
    }

    const newEntry = {
      name: selectedFile.name,
      description: selectedFile.name,
      who: DEFAULT_WHO,
      learner_plan_id: learnerPlanId,
      upload_type: uploadMode,
      file_type: DEFAULT_FILE_TYPE,
      signature_roles: [
        "Primary Assessor",
        "Secondary Assessor",
        "Learner",
        "Employer",
      ],
    };

    const formData = new FormData();
    Object.entries(newEntry).forEach(([key, value]) => {
      if (key === "signature_roles" && Array.isArray(value)) {
        value.forEach((role) => {
          formData.append("signature_roles[]", role);
        });
      } else {
        formData.append(key, String(value));
      }
    });

    formData.append("files", selectedFile);

    try {
      await addFormToLearner(formData).unwrap();
      toast.success(t("dialogs.manageSessionFiles.toast.uploadSuccess"));
      refetch();
      onSuccess?.();
      setSelectedFile(null);
    } catch (error) {
      console.error(error);
      toast.error(t("dialogs.manageSessionFiles.toast.uploadFailed"));
    }
  };

  const handleAddForm = async () => {
    if (!selectedForm) {
      toast.error(t("dialogs.manageSessionFiles.toast.selectForm"));
      return;
    }

    const selectedFormItem = availableForms.find((f: any) => String(f.id) === selectedForm) as any;
    const formName = selectedFormItem?.form_name || selectedForm;

    const newEntry = {
      name: formName,
      description: formName,
      who: DEFAULT_WHO,
      form_id: selectedForm,
      learner_plan_id: learnerPlanId,
      upload_type: uploadMode,
      file_type: DEFAULT_FILE_TYPE,
      signature_roles: [
        "Primary Assessor",
        "Secondary Assessor",
        "Learner",
        "Employer",
      ],
    };

    const formData = new FormData();
    Object.entries(newEntry).forEach(([key, value]) => {
      if (key === "signature_roles" && Array.isArray(value)) {
        value.forEach((role) => {
          formData.append("signature_roles[]", role);
        });
      } else {
        formData.append(key, String(value));
      }
    });

    try {
      await addFormToLearner(formData).unwrap();
      toast.success(t("dialogs.manageSessionFiles.toast.addFormSuccess"));
      refetch();
      onSuccess?.();
      setSelectedForm("");
    } catch (error) {
      console.error(error);
      toast.error(t("dialogs.manageSessionFiles.toast.addFormFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[min(95vw,72rem)] sm:max-w-[min(95vw,72rem)] w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("dialogs.manageSessionFiles.title")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 min-w-0">
          {/* Upload Type */}
          <div>
            <Label className="text-base font-semibold mb-2 block">
              {t("dialogs.manageSessionFiles.sections.uploadType")}
            </Label>
            <RadioGroup value={uploadMode} onValueChange={(value) => setUploadMode(value as "File Upload" | "Form Selection")}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="File Upload" id="file-upload" />
                <Label htmlFor="file-upload" className="cursor-pointer">
                  {t("dialogs.manageSessionFiles.uploadModes.fileUpload")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Form Selection" id="form-selection" />
                <Label htmlFor="form-selection" className="cursor-pointer">
                  {t("dialogs.manageSessionFiles.uploadModes.formSelection")}
                </Label>
              </div>
            </RadioGroup>

            {uploadMode === "File Upload" ? (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Button variant="outline" asChild>
                  <label className="cursor-pointer">
                    {t("dialogs.manageSessionFiles.buttons.chooseFile")}
                    <input
                      type="file"
                      className="hidden"
                      accept="application/pdf"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </Button>
                {selectedFile && <span className="text-sm truncate max-w-[240px]">{selectedFile.name}</span>}
                <Button
                  variant="outline"
                  onClick={handleAddUpload}
                  disabled={!selectedFile || isAddFormToLearnerLoading}
                >
                  {isAddFormToLearnerLoading
                    ? t("dialogs.manageSessionFiles.buttons.uploading")
                    : t("dialogs.manageSessionFiles.buttons.upload")}
                </Button>
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <Select value={selectedForm} onValueChange={setSelectedForm}>
                  <SelectTrigger className="w-full sm:w-[360px]">
                    <SelectValue placeholder={t("dialogs.manageSessionFiles.placeholders.selectForm")} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableForms.map((form: any) => (
                      <SelectItem key={form.id} value={String(form.id)}>
                        {form.form_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={handleAddForm}
                  disabled={!selectedForm || isAddFormToLearnerLoading}
                >
                  {isAddFormToLearnerLoading
                    ? t("dialogs.manageSessionFiles.buttons.adding")
                    : t("dialogs.manageSessionFiles.buttons.add")}
                </Button>
              </div>
            )}
          </div>

          {/* Files List */}
          {uploadedDocs.length > 0 && (
            <div className="mt-6 w-full overflow-x-auto rounded-md border">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[32%]">{t("dialogs.manageSessionFiles.tableHeaders.name")}</TableHead>
                    <TableHead className="w-[18%]">{t("dialogs.manageSessionFiles.tableHeaders.type")}</TableHead>
                    <TableHead className="w-[30%]">{t("dialogs.manageSessionFiles.tableHeaders.description")}</TableHead>
                    <TableHead className="w-[20%]">{t("dialogs.manageSessionFiles.tableHeaders.dateUploaded")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uploadedDocs.map((file: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="truncate" title={file.name || file.form_name}>
                        {file.name || file.form_name}
                      </TableCell>
                      <TableCell className="truncate">{file.file_type}</TableCell>
                      <TableCell className="truncate" title={file.description}>
                        {file.description}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {file.created_at
                          ? format(new Date(file.created_at), "dd/MM/yyyy")
                          : t("common.dash")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="destructive" onClick={onClose}>
            {t("dialogs.manageSessionFiles.buttons.cancelClose")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
