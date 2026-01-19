"use client";

import { FC } from "react";
import { Search, School, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { LearnerCourse } from "@/store/api/learner/types";

interface SearchAndFilterProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  selectedCourseFilter: number | "all";
  onCourseFilterChange: (value: number | "all") => void;
  courses: LearnerCourse[];
}

export const SearchAndFilter: FC<SearchAndFilterProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  selectedCourseFilter,
  onCourseFilterChange,
  courses,
}) => {
  // Transform courses to options
  const courseOptions = [
    { value: "all", label: "All Courses" },
    ...courses
      .map((courseItem) => {
        const course = courseItem.course || courseItem;
        if (course?.course_id && course.course_core_type !== "Gateway") {
          return {
            value: course.course_id,
            label: `${course.course_name} (${course.course_code})`,
            course_id: course.course_id,
            course_name: course.course_name,
            course_code: course.course_code,
          };
        }
        return null;
      })
      .filter((course): course is NonNullable<typeof course> => course !== null)
      .sort((a, b) => a.course_name.localeCompare(b.course_name)),
  ];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by title..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
            onClick={onClearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Select
        value={selectedCourseFilter === "all" ? "all" : String(selectedCourseFilter)}
        onValueChange={(value) =>
          onCourseFilterChange(value === "all" ? "all" : Number(value))
        }
      >
        <SelectTrigger className="w-[250px]">
          <School className="mr-2 h-4 w-4" />
          <SelectValue placeholder="Filter by course" />
        </SelectTrigger>
        <SelectContent>
          {courseOptions.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

