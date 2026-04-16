"use client";

import { useMemo } from "react";
import { Controller, Control, FieldErrors, UseFormWatch } from "react-hook-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import type { EvidenceFormValues } from "./evidence-form-types";

interface SignatureTableProps {
  control: Control<EvidenceFormValues>;
  errors: FieldErrors<EvidenceFormValues>;
  watch: UseFormWatch<EvidenceFormValues>;
  disabled?: boolean;
  /** When a role has been requested for signature, "Signature req" is checked and cannot be changed */
  requestedRoles?: string[];
}

const signatureRoles = [
  { role: "Trainer", label: "Trainer" },
  { role: "Learner", label: "Learner" },
  { role: "Employer", label: "Employer" },
  { role: "IQA", label: "IQA" },
];

const normalizeRole = (role?: string) => {
  const key = (role || "").toLowerCase();
  if (key === "liqa") return "iqa";
  return key;
};

export function SignatureTable({
  control,
  errors,
  watch,
  disabled = false,
  requestedRoles = [],
}: SignatureTableProps) {
  const t = useTranslations("evidenceLibrary");
  const userRole = useAppSelector((state) => state.auth.user?.role);
  const requestedSet = useMemo(() => new Set(requestedRoles), [requestedRoles]);
  const currentUserRole = normalizeRole(userRole);

  const visibleSignatureRoles = useMemo(
    () =>
      signatureRoles
        .map((item, index) => ({ ...item, index }))
        .filter((item) => normalizeRole(item.role) !== currentUserRole),
    [currentUserRole]
  );

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("form.signature.signedInAgreement")}</TableHead>
              <TableHead>{t("form.signature.name")}</TableHead>
              <TableHead>{t("form.signature.signed")}</TableHead>
              <TableHead>{t("form.signature.es")}</TableHead>
              <TableHead>{t("form.signature.date")}</TableHead>
              <TableHead>{t("form.signature.signatureReq")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleSignatureRoles.map((item) => {
              const isSigned = watch(`signatures.${item.index}.signed`);
              const isRequested = requestedSet.has(item.role);
              return (
                <TableRow key={item.role}>
                  <TableCell>
                    <Label className="text-sm">{t(`form.signature.${item.role.toLowerCase()}`)}</Label>
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`signatures.${item.index}.name`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder={t("form.placeholders.enterName")}
                          disabled={true}
                          className="w-full disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`signatures.${item.index}.signed`}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={true}
                          className="border-slate-500 disabled:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`signatures.${item.index}.es`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder={t("form.placeholders.es")}
                          disabled={true}
                          className="w-full disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`signatures.${item.index}.date`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="date"
                          disabled={true}
                          className="w-full disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:cursor-not-allowed"
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`signatures.${item.index}.signature_required`}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={disabled || isSigned || isRequested}
                          className="border-slate-500 disabled:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                      )}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {errors.signatures && (
        <p className="text-sm text-destructive">
          {t(String(errors.signatures.message))}
        </p>
      )}
    </div>
  );
}

