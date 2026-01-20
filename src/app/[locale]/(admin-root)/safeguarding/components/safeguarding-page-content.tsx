/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Shield, Phone, Mail, Info, Save, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useGetSafeguardingContactsQuery, useSaveSafeguardingContactMutation } from "@/store/api/safeguarding/safeguardingApi";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const safeguardingSchema = (t: (key: string) => string) => z.object({
  telNumber: z.string().optional(),
  mobileNumber: z.string().optional(),
  emailAddress: z
    .email(t("form.emailInvalid"))
    .refine((val) => val !== "", { message: t("form.emailRequired") }),
  additionalInfo: z.string().optional(),
});

type SafeguardingFormData = z.infer<ReturnType<typeof safeguardingSchema>>;

export function SafeguardingPageContent() {
  const t = useTranslations("safeguarding");
  const { data, isLoading, error, refetch } = useGetSafeguardingContactsQuery();
  const [saveContact, { isLoading: isSaving }] = useSaveSafeguardingContactMutation();
  const [editingContact, setEditingContact] = useState<boolean>(false);

  const form = useForm<SafeguardingFormData>({
    resolver: zodResolver(safeguardingSchema(t)),
    mode: "onChange",
    defaultValues: {
      telNumber: "",
      mobileNumber: "",
      emailAddress: "",
      additionalInfo: "",
    },
  });

  // Load existing contact data when available
  useEffect(() => {
    if (data?.data && data.data.length > 0) {
      const contact = data.data[0]; // Use first contact if multiple exist
      form.reset({
        telNumber: contact.telNumber || "",
        mobileNumber: contact.mobileNumber || "",
        emailAddress: contact.emailAddress || "",
        additionalInfo: contact.additionalInfo || "",
      });
      setEditingContact(true);
    }
  }, [data, form]);

  const handleSave = async (formData: SafeguardingFormData) => {
    try {
      await saveContact({
        telNumber: formData.telNumber || "",
        mobileNumber: formData.mobileNumber || "",
        emailAddress: formData.emailAddress || "",
        additionalInfo: formData.additionalInfo || "",
      }).unwrap();
      toast.success(t("toast.contactSaved"));
      refetch();
      setEditingContact(true);
    } catch (error: any) {
      console.error("Error saving data:", error);
      toast.error(error?.data?.message || error?.message || t("toast.saveFailed"));
    }
  };

  const handleReset = () => {
    form.reset({
      telNumber: "",
      mobileNumber: "",
      emailAddress: "",
      additionalInfo: "",
    });
    setEditingContact(false);
  };

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        icon={Shield}
      />

      {/* Editing Badge */}
      {editingContact && (
        <Badge variant="outline" className="mb-4">
          <Info className="h-3 w-3 mr-1" />
          {t("form.editingExisting")}
        </Badge>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {t("toast.loadFailed")}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      {!isLoading && (
        <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <CardTitle>{t("form.contactInformation")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Telephone Number */}
                  <div className="space-y-2">
                    <Label htmlFor="telNumber">{t("form.telephoneNumber")}</Label>
                    <Input
                      id="telNumber"
                      placeholder={t("form.telephonePlaceholder")}
                      {...form.register("telNumber")}
                      className="w-full"
                    />
                    {form.formState.errors.telNumber && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.telNumber.message}
                      </p>
                    )}
                  </div>

                  {/* Mobile Number */}
                  <div className="space-y-2">
                    <Label htmlFor="mobileNumber">{t("form.mobileNumber")}</Label>
                    <Input
                      id="mobileNumber"
                      placeholder={t("form.mobilePlaceholder")}
                      {...form.register("mobileNumber")}
                      className="w-full"
                    />
                    {form.formState.errors.mobileNumber && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.mobileNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email Address */}
                <div className="space-y-2">
                  <Label htmlFor="emailAddress">{t("form.emailAddress")} <span className="text-destructive">{t("form.required")}</span></Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="emailAddress"
                      type="email"
                      placeholder={t("form.emailPlaceholder")}
                      {...form.register("emailAddress")}
                      className="pl-10"
                    />
                  </div>
                  {form.formState.errors.emailAddress && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.emailAddress.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Information Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <CardTitle>{t("form.additionalInformation")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="additionalInfo">{t("form.additionalDetails")}</Label>
                  <Textarea
                    id="additionalInfo"
                    placeholder={t("form.additionalDetailsPlaceholder")}
                    rows={8}
                    {...form.register("additionalInfo")}
                    className="resize-none"
                  />
                  {form.formState.errors.additionalInfo && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.additionalInfo.message}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card>
            <CardContent>
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSaving}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  {t("form.reset")}
                </Button>
                <Button
                  type="submit"
                  disabled={isSaving || !form.formState.isValid}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("form.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {t("form.saveContact")}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
