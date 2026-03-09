"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  useGetFormTemplatesQuery,
  useDeleteFormTemplateMutation,
} from "@/store/api/forms/formsApi";
import { Edit, Trash2, Plus, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export function TemplatesSection() {
  const t = useTranslations("forms.templates");
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  const { data, isLoading, refetch } = useGetFormTemplatesQuery();
  const [deleteTemplate, { isLoading: isDeleting }] =
    useDeleteFormTemplateMutation();

  const templates = data?.data || [];

  const handleDeleteClick = (template: { id: string | number; template_name: string }) => {
    setTemplateToDelete({ id: template.id, name: template.template_name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!templateToDelete) return;

    try {
      await deleteTemplate({ templateId: templateToDelete.id }).unwrap();
      toast.success(t("toastDeleteSuccess"));
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
      refetch();
    } catch (error: unknown) {
      const errorMessage =
        error && typeof error === "object" && "data" in error
          ? (error as { data?: { message?: string } }).data?.message
          : undefined;
      toast.error(errorMessage || t("toastDeleteFailed"));
    }
  };

  const handleEditTemplate = (templateId: string | number) => {
    router.push(`/forms/${templateId}/builder?mode=template`);
  };

  const handleCreateFromTemplate = (templateId: string | number) => {
    router.push(`/forms/new/builder?template=${templateId}`);
  };

  if (isLoading) {
    return (
      <div className="rounded-md border p-4 space-y-2">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-md border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{t("sectionTitle")}</h3>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/forms/new/builder")}
        >
          <Plus className="mr-2 h-4 w-4" />
          {t("createTemplate")}
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t("noTemplatesFound")}</p>
          <p className="text-sm">{t("noTemplatesDescription")}</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("templateName")}</TableHead>
                <TableHead>{t("createDate")}</TableHead>
                <TableHead className="text-right">{t("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">
                    {template.template_name}
                  </TableCell>
                  <TableCell>
                    {template.created_at
                      ? format(new Date(template.created_at), "MMM dd, yyyy")
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreateFromTemplate(template.id)}
                      >
                        {t("useTemplate")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditTemplate(template.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDeleteClick({
                            id: template.id,
                            template_name: template.template_name,
                          })
                        }
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", { name: templateToDelete?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? t("deleteDialog.deleting") : t("deleteDialog.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

