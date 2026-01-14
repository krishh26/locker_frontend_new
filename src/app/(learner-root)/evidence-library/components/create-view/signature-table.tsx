"use client";

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
import type { EvidenceFormValues } from "./evidence-form-types";

interface SignatureTableProps {
  control: Control<EvidenceFormValues>;
  errors: FieldErrors<EvidenceFormValues>;
  watch: UseFormWatch<EvidenceFormValues>;
  disabled?: boolean;
}

const signatureRoles = [
  { role: "Trainer", label: "Trainer" },
  { role: "Learner", label: "Learner" },
  { role: "Employer", label: "Employer" },
  { role: "IQA", label: "IQA" },
];

export function SignatureTable({
  control,
  errors,
  watch,
  disabled = false,
}: SignatureTableProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Signed in Agreement:</TableHead>
              <TableHead>Name:</TableHead>
              <TableHead>Signed:</TableHead>
              <TableHead>ES:</TableHead>
              <TableHead>Date:</TableHead>
              <TableHead>Signature req:</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {signatureRoles.map((item, index) => {
              const isSigned = watch(`signatures.${index}.signed`);
              return (
                <TableRow key={item.role}>
                  <TableCell>
                    <Label className="text-sm">{item.label}</Label>
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`signatures.${index}.name`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="Enter name"
                          disabled={true}
                          className="w-full"
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`signatures.${index}.signed`}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={true}
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`signatures.${index}.es`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          placeholder="ES"
                          disabled={true}
                          className="w-full"
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`signatures.${index}.date`}
                      control={control}
                      render={({ field }) => (
                        <Input
                          {...field}
                          type="date"
                          disabled={true}
                          className="w-full"
                        />
                      )}
                    />
                  </TableCell>
                  <TableCell>
                    <Controller
                      name={`signatures.${index}.signature_required`}
                      control={control}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value || false}
                          onCheckedChange={field.onChange}
                          disabled={disabled || isSigned}
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
          {errors.signatures.message}
        </p>
      )}
    </div>
  );
}

