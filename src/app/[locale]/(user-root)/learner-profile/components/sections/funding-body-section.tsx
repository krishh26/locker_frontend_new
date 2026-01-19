"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LearnerData } from "@/store/api/learner/types";

interface FundingBodySectionProps {
  learner: LearnerData;
  canEdit?: boolean;
}

export function FundingBodySection({ learner, canEdit = false }: FundingBodySectionProps) {
  const form = useFormContext();
  const fundingBody = learner.funding_body || "-";
  const awardingBody = (learner as { awarding_body?: string }).awarding_body || "-";
  const registrationNumber = (learner as { registration_number?: string }).registration_number || "-";
  const registrationDate = (learner as { registration_date?: string }).registration_date || "-";
  const laraCode = (learner as { lara_code?: string }).lara_code || "-";

  const formatDate = (date: string | undefined | null): string => {
    if (!date || date === "-") return "-";
    try {
      const d = new Date(date);
      return d.toLocaleDateString();
    } catch {
      return date;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Funding Body</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Funding Body</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("funding_body")}
                  className="min-h-10"
                />
                {form.formState.errors.funding_body && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.funding_body.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {fundingBody}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Awarding Body</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("awarding_body")}
                  className="min-h-10"
                />
                {form.formState.errors.awarding_body && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.awarding_body.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {awardingBody}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Registration Number</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("registration_number")}
                  className="min-h-10"
                />
                {form.formState.errors.registration_number && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.registration_number.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {registrationNumber}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Registration Date</Label>
            {canEdit ? (
              <>
                <Input
                  type="date"
                  {...form.register("registration_date")}
                  className="min-h-10"
                />
                {form.formState.errors.registration_date && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.registration_date.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {formatDate(registrationDate)}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">LARA Code</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("lara_code")}
                  className="min-h-10"
                />
                {form.formState.errors.lara_code && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.lara_code.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {laraCode}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
