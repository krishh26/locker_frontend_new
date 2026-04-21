"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList";
import {
  useGetCourseExclusionQuery,
  useUpdateCourseExclusionMutation,
} from "@/store/api/course-exclusion/courseExclusionApi";
import type { Course } from "@/store/api/course/types";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useAppSelector } from "@/store/hooks";
import { selectMasterAdminOrganisationId } from "@/store/slices/orgContextSlice";

export function ProgressExclusionForm() {
  const t = useTranslations("progressExclusion");

  const masterAdminOrgId = useAppSelector(selectMasterAdminOrganisationId);
  const authUser = useAppSelector((state) => state.auth.user);
  const organisationId =
    masterAdminOrgId ??
    (authUser?.assignedOrganisationIds?.length
      ? authUser.assignedOrganisationIds[0]
      : undefined);

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [isExcluded, setIsExcluded] = useState(false);

  const { data: coursesData, isLoading: coursesLoading } = useCachedCoursesList();

  const courseIdNum = selectedCourseId ? Number(selectedCourseId) : undefined;
  const canQueryExclusion =
    organisationId != null && !Number.isNaN(Number(organisationId)) && courseIdNum != null && !Number.isNaN(courseIdNum);

  const {
    data: exclusionData,
    isLoading: exclusionLoading,
    error: exclusionError,
  } = useGetCourseExclusionQuery(
    {
      organisation_id: Number(organisationId),
      course_id: courseIdNum,
    },
    {
      skip: !canQueryExclusion,
    }
  );

  const [updateCourseExclusion, { isLoading: isSubmitting }] =
    useUpdateCourseExclusionMutation();

  const courses = coursesData?.data || [];

  useEffect(() => {
    if (!canQueryExclusion) {
      setIsExcluded(false);
      return;
    }
    if (exclusionLoading) return;
    setIsExcluded(!!exclusionData?.data?.is_excluded);
  }, [exclusionData, exclusionLoading, canQueryExclusion]);

  const handleSubmit = async () => {
    if (organisationId == null || Number.isNaN(Number(organisationId))) {
      toast.error(t("toast.organisationRequired"));
      return;
    }
    if (!selectedCourseId || courseIdNum == null || Number.isNaN(courseIdNum)) {
      toast.error(t("toast.selectCourseRequired"));
      return;
    }

    try {
      await updateCourseExclusion({
        organisation_id: Number(organisationId),
        course_id: courseIdNum,
        is_excluded: isExcluded,
      }).unwrap();

      toast.success(t("toast.updateSuccess"));
    } catch (error: unknown) {
      const errorMessage =
        (error as { data?: { error?: string; message?: string }; message?: string })?.data?.error ||
        (error as { data?: { error?: string; message?: string }; message?: string })?.data?.message ||
        (error as { data?: { error?: string; message?: string }; message?: string })?.message ||
        t("toast.updateFailed");
      toast.error(errorMessage);
    }
  };

  const orgMissing = organisationId == null || Number.isNaN(Number(organisationId));

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("card.title")}</CardTitle>
        <CardDescription>{t("card.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>{t("info.description")}</AlertDescription>
        </Alert>

        {orgMissing ? (
          <Alert variant="destructive">
            <AlertDescription>{t("form.organisationRequired")}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="course-select">
            {t("form.courseLabel")} <span className="text-destructive">*</span>
          </Label>
          <Select
            value={selectedCourseId}
            onValueChange={(value) => {
              setSelectedCourseId(value);
              setIsExcluded(false);
            }}
            disabled={coursesLoading || orgMissing}
          >
            <SelectTrigger id="course-select" className="w-full">
              <SelectValue placeholder={t("form.coursePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {courses.map((course: Course) => (
                <SelectItem key={course.course_id} value={course.course_id.toString()}>
                  {course.course_name} {course.course_code ? `(${course.course_code})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedCourseId && !orgMissing ? (
          <>
            {exclusionLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full max-w-md" />
                <Skeleton className="h-10 w-32" />
              </div>
            ) : exclusionError ? (
              <Alert variant="destructive">
                <AlertDescription>{t("form.loadError")}</AlertDescription>
              </Alert>
            ) : (
              <div className="flex flex-col gap-4 rounded-md border p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <Label htmlFor="course-exclusion-switch" className="text-base">
                    {t("form.excludeToggleLabel")}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t("form.excludeToggleHint")}</p>
                </div>
                <Switch
                  id="course-exclusion-switch"
                  checked={isExcluded}
                  onCheckedChange={(checked) => setIsExcluded(checked === true)}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {!exclusionLoading && !exclusionError ? (
              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={isSubmitting} size="lg">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSubmitting ? t("form.submitting") : t("form.submit")}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
