"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LearnerData } from "@/store/api/learner/types";

interface AddressSectionProps {
  learner: LearnerData;
  canEdit?: boolean;
}

export function AddressSection({ learner, canEdit = false }: AddressSectionProps) {
  const form = useFormContext();
  const street = (learner as { street?: string }).street || "-";
  const suburb = (learner as { suburb?: string }).suburb || "-";
  const town = (learner as { town?: string }).town || "-";
  const country = (learner as { country?: string }).country || "-";
  const homePostcode = (learner as { home_postcode?: string }).home_postcode || "-";
  const countryOfDomicile = (learner as { country_of_domicile?: string }).country_of_domicile || "-";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Address</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">House No/Name and Street</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("street")}
                  className="min-h-10"
                />
                {form.formState.errors.street && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.street.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {street}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Suburb/Village</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("suburb")}
                  className="min-h-10"
                />
                {form.formState.errors.suburb && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.suburb.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {suburb}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Town/City</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("town")}
                  className="min-h-10"
                />
                {form.formState.errors.town && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.town.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {town}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Country</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("country")}
                  className="min-h-10"
                />
                {form.formState.errors.country && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.country.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {country}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Home Postcode</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("home_postcode")}
                  className="min-h-10"
                />
                {form.formState.errors.home_postcode && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.home_postcode.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {homePostcode}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Country of Domicile</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("country_of_domicile")}
                  className="min-h-10"
                />
                {form.formState.errors.country_of_domicile && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.country_of_domicile.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {countryOfDomicile}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

