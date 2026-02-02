/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";;
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectCourseType, clearCourseType } from "@/store/slices/courseBuilderSlice";
import { useGetCourseQuery } from "@/store/api/course/courseApi";
import { BookOpen, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { CourseForm } from "./components/course-form";
import type { CourseCoreType } from "@/store/api/course/types";

export default function CoursePage() {
    const searchParams = useSearchParams();
    const dispatch = useAppDispatch();
    const courseTypeFromRedux = useAppSelector(selectCourseType);
    const [courseType, setCourseType] = useState<CourseCoreType | null>(null);
    const router = useRouter();
    const courseId = searchParams.get("id");
    const stepParam = searchParams.get("step");
    const initialStep = stepParam === "1" ? 1 : 0;
    const courseIdNumber = courseId ? Number(courseId) : undefined;

    // Fetch course data in edit mode to determine course type
    const { data: courseData, isLoading: isLoadingCourse } = useGetCourseQuery(
        courseIdNumber!,
        { skip: !courseId || !courseIdNumber }
    );

    // Determine the mode
    const isCreateMode = !courseId && courseType !== null;
    const isEditMode = courseId !== null;

    // Read course type from Redux in create mode and clear Redux state
    useEffect(() => {
        if (!courseId && courseTypeFromRedux) {
            // Create mode: read course type from Redux and store in local state
            setCourseType(courseTypeFromRedux as CourseCoreType);
            dispatch(clearCourseType());
        } else if (courseId) {
            // Edit mode: clear any Redux state to avoid conflicts
            if (courseTypeFromRedux) {
                dispatch(clearCourseType());
            }
        }
    }, [courseId, courseTypeFromRedux, dispatch]);

    // Extract course type from API response in edit mode
    useEffect(() => {
        if (isEditMode && courseData?.data) {
            const apiCourseCoreType = (courseData.data as any).course_core_type as CourseCoreType;
            if (apiCourseCoreType && ["Qualification", "Standard", "Gateway"].includes(apiCourseCoreType)) {
                setCourseType(apiCourseCoreType);
            }
        }
    }, [isEditMode, courseData]);

    // Redirect if trying to create without course type
    useEffect(() => {
        if (!courseId && !courseType && !courseTypeFromRedux) {
            router.push("/course-builder");
        }
    }, [courseId, courseType, courseTypeFromRedux, router]);

    // Don't render form if no course type in create mode
    if (isCreateMode && !courseType) {
        return null;
    }

    // Show loading state in edit mode until course type is determined
    if (isEditMode && (!courseType || isLoadingCourse)) {
        return (
            <div className="space-y-6 px-4 lg:px-6 pb-8">
                <PageHeader
                    title="Edit Course"
                    icon={BookOpen}
                    showBackButton
                    backButtonHref="/course-builder"
                />
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 px-4 lg:px-6 pb-8">
            {/* Page Header */}
            <PageHeader
                title={isCreateMode ? "Create Course" : "Edit Course"}
                icon={BookOpen}
                showBackButton
                backButtonHref="/course-builder"
            />

            {(isCreateMode || isEditMode) && courseType && (
                <CourseForm
                    courseType={courseType}
                    courseId={courseId}
                    initialStep={initialStep}
                />
            )}
        </div>
    );
}
