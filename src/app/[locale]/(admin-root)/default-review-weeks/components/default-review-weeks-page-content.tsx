"use client";

import { useState, useEffect } from "react";
import { Settings, AlertTriangle, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    useGetDefaultReviewWeeksConfigQuery,
    useSaveDefaultReviewWeeksConfigMutation,
} from "@/store/api/default-review-weeks/defaultReviewWeeksApi";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";

const defaultReviewWeeksSchema = (t: (key: string) => string) => z.object({
    noReviewWeeks: z
        .number({ message: t("form.reviewWarningRequired") })
        .min(1, t("form.mustBeAtLeast1"))
        .max(52, t("form.cannotExceed52"))
        .int(t("form.mustBeWholeNumber")),
    noInductionWeeks: z
        .number({ message: t("form.inductionWarningRequired") })
        .min(1, t("form.mustBeAtLeast1"))
        .max(52, t("form.cannotExceed52"))
        .int(t("form.mustBeWholeNumber")),
    requireFileUpload: z.boolean(),
});

type DefaultReviewWeeksFormData = z.infer<ReturnType<typeof defaultReviewWeeksSchema>>;

export function DefaultReviewWeeksPageContent() {
    const t = useTranslations("defaultReviewWeeks");
    const common = useTranslations("common");
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const {
        data: configResponse,
        isLoading,
        error,
        refetch,
    } = useGetDefaultReviewWeeksConfigQuery();

    const [saveConfig, { isLoading: isSaving }] =
        useSaveDefaultReviewWeeksConfigMutation();

    const form = useForm<DefaultReviewWeeksFormData>({
        resolver: zodResolver(defaultReviewWeeksSchema(t)),
        defaultValues: {
            noReviewWeeks: 5,
            noInductionWeeks: 2,
            requireFileUpload: true,
        },
    }) as ReturnType<typeof useForm<DefaultReviewWeeksFormData>>;

    // Update form when config data changes
    useEffect(() => {
        if (configResponse?.data && isInitialLoad) {
            const formData = {
                noReviewWeeks: configResponse.data.noReviewWeeks,
                noInductionWeeks: configResponse.data.noInductionWeeks,
                requireFileUpload: configResponse.data.requireFileUpload ?? true,
            };
            form.reset(formData);
            setIsInitialLoad(false);
        }
    }, [configResponse, form, isInitialLoad]);

    const handleSubmit = async (data: DefaultReviewWeeksFormData) => {
        try {
            await saveConfig({
                noReviewWeeks: data.noReviewWeeks,
                noInductionWeeks: data.noInductionWeeks,
                requireFileUpload: data.requireFileUpload ?? true,
            }).unwrap();
            toast.success(t("toast.configSaved"));
            refetch();
        } catch (error: any) {
            console.error("Failed to save configuration:", error);
            const errorMessage =
                error?.data?.message ||
                error?.message ||
                t("toast.saveFailed");
            toast.error(errorMessage);
        }
    };

    return (
        <div className="space-y-6 px-4 lg:px-6 pb-8">
            {/* Page Header */}
            <PageHeader
                title={t("pageTitle")}
                subtitle={t("pageSubtitle")}
                icon={Settings}
            />

            {/* Loading State */}
            {isLoading && (
                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-48" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            )}

            {/* Error State */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        {t("toast.loadFailed")}
                    </AlertDescription>
                </Alert>
            )}

            {/* Main Form */}
            {!isLoading && (
                <form onSubmit={form.handleSubmit(handleSubmit)}>
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                <CardTitle>{t("form.reviewPeriodSettings")}</CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("form.reviewPeriodDescription")}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Review Warning Setting */}
                                <div className="space-y-2">
                                    <Label htmlFor="noReviewWeeks">
                                        {t("form.noReviewWeeksLabel")}
                                    </Label>
                                    <div className="relative">
                                        <InputGroup>
                                            <InputGroupInput placeholder={t("form.noReviewWeeksPlaceholder")} {...form.register("noReviewWeeks", {
                                                valueAsNumber: true,
                                            })} id="noReviewWeeks" type="number" min={1} max={52} />

                                            <InputGroupAddon align="inline-end">{t("form.weeks")}</InputGroupAddon>
                                        </InputGroup>
                                    </div>
                                    {form.formState.errors.noReviewWeeks && (
                                        <p className="text-sm text-destructive">
                                            {form.formState.errors.noReviewWeeks.message}
                                        </p>
                                    )}
                                </div>

                                {/* Induction Warning Setting */}
                                <div className="space-y-2">
                                    <Label htmlFor="noInductionWeeks">
                                        {t("form.noInductionWeeksLabel")}
                                    </Label>
                                    <div className="relative">
                                        <InputGroup>
                                            <InputGroupInput placeholder={t("form.noInductionWeeksPlaceholder")} {...form.register("noInductionWeeks", {
                                                valueAsNumber: true,
                                            })} id="noInductionWeeks" type="number" min={1} max={52} />

                                            <InputGroupAddon align="inline-end">{t("form.weeks")}</InputGroupAddon>
                                        </InputGroup>
                                       
                                    </div>
                                    {form.formState.errors.noInductionWeeks && (
                                        <p className="text-sm text-destructive">
                                            {form.formState.errors.noInductionWeeks.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-center pt-4 border-t">
                                <Button type="submit" disabled={isSaving || !form.formState.isValid} size="lg">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            {t("form.saving")}
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            {t("form.save")}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            )}

            {/* Information Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-secondary" />
                        <CardTitle>{t("info.title")}</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {t("info.description")}
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
