"use client";

import { useState, useEffect } from "react";
import { Settings, AlertTriangle, Save, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
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

const defaultReviewWeeksSchema = z.object({
    noReviewWeeks: z
        .number({ message: "Review warning weeks is required" })
        .min(1, "Must be at least 1 week")
        .max(52, "Cannot exceed 52 weeks")
        .int("Must be a whole number"),
    noInductionWeeks: z
        .number({ message: "Induction warning weeks is required" })
        .min(1, "Must be at least 1 week")
        .max(52, "Cannot exceed 52 weeks")
        .int("Must be a whole number"),
    requireFileUpload: z.boolean(),
});

type DefaultReviewWeeksFormData = z.infer<typeof defaultReviewWeeksSchema>;

export function DefaultReviewWeeksPageContent() {
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
        resolver: zodResolver(defaultReviewWeeksSchema),
        mode: "onChange",
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
            toast.success("Configuration saved successfully!");
            refetch();
        } catch (error: any) {
            console.error("Failed to save configuration:", error);
            const errorMessage =
                error?.data?.message ||
                error?.message ||
                "Failed to save configuration. Please try again.";
            toast.error(errorMessage);
        }
    };

    return (
        <div className="space-y-6 px-4 lg:px-6 pb-8">
            {/* Page Header */}
            <PageHeader
                title="Default Review Weeks Configuration"
                subtitle="Configure the default review period settings for all learner types without custom review periods"
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
                        Failed to load configuration. Please try again.
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
                                <CardTitle>Review Period Settings</CardTitle>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure warning periods for reviews and inductions
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Review Warning Setting */}
                                <div className="space-y-2">
                                    <Label htmlFor="noReviewWeeks">
                                        Display Warning if there has been no review for:
                                    </Label>
                                    <div className="relative">
                                        <InputGroup>
                                            <InputGroupInput placeholder="Enter weeks" {...form.register("noReviewWeeks", {
                                                valueAsNumber: true,
                                            })} id="noReviewWeeks" type="number" min={1} max={52} />

                                            <InputGroupAddon align="inline-end">Weeks</InputGroupAddon>
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
                                        Display Warning if there has been no induction for:
                                    </Label>
                                    <div className="relative">
                                        <InputGroup>
                                            <InputGroupInput placeholder="Enter weeks" {...form.register("noInductionWeeks", {
                                                valueAsNumber: true,
                                            })} id="noInductionWeeks" type="number" min={1} max={52} />

                                            <InputGroupAddon align="inline-end">Weeks</InputGroupAddon>
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
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            )}

            {/* Information Card */}
            <Card className="bg-muted/50">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        <CardTitle>Important Information</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        These settings will be applied as the default review period for all
                        learner types that don't have a custom review period assigned.
                        Changes will take effect immediately after saving and will affect
                        new review sessions going forward.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
