"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSaveSignatureMutation } from "@/store/api/documents-to-sign/documentsToSignApi";
import { useAppSelector } from "@/store/hooks";
import { toast } from "sonner";

interface SignatureData {
  signed: boolean;
  name?: string;
  date?: string;
}

interface DocumentSignatures {
  employer?: SignatureData;
  iqa?: SignatureData;
  trainer?: SignatureData;
  learner?: SignatureData;
}

interface RequestedSignature {
  role: string;
  is_requested: boolean;
}

interface DocumentToSign {
  id: string;
  documentName: string;
  courseName: string;
  signatures: DocumentSignatures;
  requestedSignatures: RequestedSignature[];
}

interface SignatureModalProps {
  open: boolean;
  onClose: () => void;
  document: DocumentToSign | null;
  onSave: () => void;
}

export function SignatureModal({
  open,
  onClose,
  document,
  onSave,
}: SignatureModalProps) {
  const t = useTranslations("learnerDocumentsToSign");
  const locale = useLocale();
  const user = useAppSelector((state) => state.auth.user);
  const userRole = user?.role || "";
  const [signatures, setSignatures] = useState<DocumentSignatures>(
    document?.signatures || {}
  );
  const [saveSignature, { isLoading: isSaving }] = useSaveSignatureMutation();

  useEffect(() => {
    if (document) {
      setSignatures(document.signatures || {});
    }
  }, [document]);

  const handleSignatureChange = (
    roleKey: string,
    field: string,
    value: boolean
  ) => {
    setSignatures((prev) => ({
      ...prev,
      [roleKey]: {
        ...prev[roleKey as keyof DocumentSignatures],
        [field]: value,
      },
    }));
  };

  // Check if current user can sign for a specific role
  const canSignForRole = (roleKey: string): boolean => {
    switch (roleKey) {
      case "employer":
        return userRole === "Employer";
      case "iqa":
        return userRole === "IQA" || userRole === "LIQA";
      case "trainer":
        return userRole === "Trainer";
      case "learner":
        return userRole === "Learner";
      default:
        return false;
    }
  };

  // Check if the field should be disabled
  const isFieldDisabled = (roleKey: string): boolean => {
    if (!canSignForRole(roleKey)) {
      return true;
    }
    const signature = signatures[roleKey as keyof DocumentSignatures];
    return signature?.signed || false;
  };

  // Get signature roles that are requested for this document
  const getSignatureRoles = (): Array<{
    key: string;
    label: string;
    isRequested: boolean;
  }> => {
    if (!document?.requestedSignatures) return [];

    return document.requestedSignatures.map((reqSig) => ({
      key: reqSig.role.toLowerCase(),
      label: reqSig.role,
      isRequested: reqSig.is_requested,
    }));
  };

  const signatureRoles = getSignatureRoles();

  const getRoleLabel = (roleKey: string, fallback: string) => {
    const key = roleKey.toLowerCase();
    if (key === "employer" || key === "iqa" || key === "trainer" || key === "learner") {
      return t(`roles.${key}` as const);
    }
    return fallback;
  };

  const handleSave = async () => {
    if (!document?.id) {
      onClose();
      return;
    }

    try {
      // Find all signatures that were just signed by the current user
      const signedRoles = Object.keys(signatures).filter((roleKey) => {
        const signature = signatures[roleKey as keyof DocumentSignatures];
        return signature?.signed && canSignForRole(roleKey);
      });

      if (signedRoles.length > 0) {
        // Save each signature
        for (const roleKey of signedRoles) {
          await saveSignature({
            id: document.id,
            data: {
              role: roleKey.charAt(0).toUpperCase() + roleKey.slice(1),
              is_signed: true,
            },
          }).unwrap();
        }

        toast.success(t("toast.saved"));
        onSave();
        onClose();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error(t("toast.saveError"));
    }
  };

  const formatSignatureDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-1rem)] max-w-3xl! p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("modal.title")}</DialogTitle>
        </DialogHeader>

        {document && (
          <div className="space-y-4 py-2 overflow-x-auto">
            <div>
              <p className="font-semibold">
                {t("modal.documentLabel")} {document.documentName}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("modal.courseLabel")} {document.courseName}
              </p>
            </div>

            <div className="rounded-md border overflow-hidden w-full">
              <Table className="">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">{t("modal.tableHeaders.signedInAgreement")}</TableHead>
                    <TableHead>{t("modal.tableHeaders.name")}</TableHead>
                    <TableHead>{t("modal.tableHeaders.signed")}</TableHead>
                    <TableHead>{t("modal.tableHeaders.date")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signatureRoles.map((role) => {
                    const signature =
                      (signatures[role.key as keyof DocumentSignatures] as SignatureData | undefined) ||
                      ({} as SignatureData);
                    const isSigned =
                      document.signatures?.[
                        role.key as keyof DocumentSignatures
                      ]?.signed || false;

                    return (
                      <TableRow key={role.key}>
                        <TableCell className="font-medium">
                          {getRoleLabel(role.key, role.label)}
                        </TableCell>
                        <TableCell className="max-w-[170px] truncate">
                          {signature?.name || ""}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={signature?.signed || false}
                              onCheckedChange={(checked) =>
                                handleSignatureChange(
                                  role.key,
                                  "signed",
                                  checked === true
                                )
                              }
                              disabled={
                                isFieldDisabled(role.key) || isSigned
                              }
                            />
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatSignatureDate(signature?.date)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("modal.buttons.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? t("modal.buttons.saving") : t("modal.buttons.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

