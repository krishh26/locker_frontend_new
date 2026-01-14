"use client";

import { useState, useEffect } from "react";
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

        toast.success("Signature saved successfully!");
        onSave();
        onClose();
      } else {
        onClose();
      }
    } catch (error) {
      console.error("Error saving signature:", error);
      toast.error("Error saving signature");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Document Signature Agreement</DialogTitle>
        </DialogHeader>

        {document && (
          <div className="space-y-4 py-4">
            <div>
              <p className="font-semibold">Document: {document.documentName}</p>
              <p className="text-sm text-muted-foreground">
                Course: {document.courseName}
              </p>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Signed in Agreement</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Signed</TableHead>
                    <TableHead>Date</TableHead>
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
                          {role.label}
                        </TableCell>
                        <TableCell>{signature?.name || ""}</TableCell>
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
                        <TableCell className="text-sm text-muted-foreground">
                          {signature?.date || ""}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel/Close
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

