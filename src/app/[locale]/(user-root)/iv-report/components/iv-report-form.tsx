"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useGetCoursesQuery } from "@/store/api/course/courseApi";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AssessmentQuestion {
  id: string;
  question: string;
}

const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: "q1",
    question: "Was the learner observed directly by an assessor?",
  },
  {
    id: "q2",
    question: "Was knowledge and understanding assessed?",
  },
  {
    id: "q3",
    question: "Is work product evidence available?",
  },
  {
    id: "q4",
    question: "Has the learner supplied sufficient job/personal details?",
  },
  {
    id: "q5",
    question: "Are the learner's assessment records being completed on an ongoing basis?",
  },
  {
    id: "q6",
    question: "Has the assessor confirmed authenticity, sufficiency, accuracy, consistency and validity?",
  },
];

type AssessmentAnswer = "always" | "sometimes" | "never" | "";

export function IVReportForm() {
  const searchParams = useSearchParams();
  const courseIdFromUrl = searchParams.get("course_id");

  // Form state
  const [courseName, setCourseName] = useState<string>("");
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswer>>({});

  // Fetch courses
  const { data: coursesData } = useGetCoursesQuery(
    { page: 1, page_size: 500 },
    { skip: false }
  );

  // Get the course from URL parameter
  const selectedCourse = coursesData?.data?.find(
    (c) => c.course_id.toString() === courseIdFromUrl
  );

  // Set course from URL parameter
  useEffect(() => {
    if (courseIdFromUrl && selectedCourse) {
      setCourseName(selectedCourse.course_id.toString());
    }
  }, [courseIdFromUrl, selectedCourse]);

  // Initialize answers
  useEffect(() => {
    const initialAnswers: Record<string, AssessmentAnswer> = {};
    assessmentQuestions.forEach((q) => {
      initialAnswers[q.id] = "";
    });
    setAnswers(initialAnswers);
  }, []);

  const handleAnswerChange = (questionId: string, value: AssessmentAnswer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Form Fields Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Assessment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Course Name */}
            <div className="space-y-2">
              <Label htmlFor="course-name">Course Name</Label>
              <Select value={courseName} onValueChange={setCourseName} disabled={!selectedCourse}>
                <SelectTrigger id="course-name" className="w-full">
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {selectedCourse && (
                    <SelectItem
                      key={selectedCourse.course_id}
                      value={selectedCourse.course_id.toString()}
                    >
                      {selectedCourse.course_name || "Untitled Course"}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Assessor(s) Name */}
            <div className="space-y-2">
              <Label htmlFor="assessor-name">Assessor(s) Name</Label>
              <p id="assessor-name" className="text-sm text-muted-foreground py-2">
                {/* Will be populated from API */}
              </p>
            </div>

            {/* Learner Name */}
            <div className="space-y-2">
              <Label htmlFor="learner-name">Learner Name</Label>
              <p id="learner-name" className="text-sm text-muted-foreground py-2">
                {/* Will be populated from API */}
              </p>
            </div>

            {/* Batch No & Creator */}
            <div className="space-y-2">
              <Label htmlFor="batch-creator">Batch No & Creator</Label>
              <p id="batch-creator" className="text-sm text-muted-foreground py-2">
                {/* Will be populated from API */}
              </p>
            </div>

            {/* IQAs for Batch */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="iqas-batch">IQAs for Batch</Label>
              <p id="iqas-batch" className="text-sm text-muted-foreground py-2">
                {/* Will be populated from API */}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment Questions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Learner Assessment for Unit(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50%] min-w-[300px]">
                    Question
                  </TableHead>
                  <TableHead className="text-center">Always (Yes)</TableHead>
                  <TableHead className="text-center">Sometimes</TableHead>
                  <TableHead className="text-center">Never (No)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessmentQuestions.map((question, index) => (
                  <TableRow
                    key={question.id}
                    className={cn(
                      index % 2 === 0 && "bg-muted/50"
                    )}
                  >
                    <TableCell className="font-medium">
                      {question.question}
                    </TableCell>
                    <TableCell colSpan={3} className="p-0">
                      <RadioGroup
                        value={answers[question.id] || ""}
                        onValueChange={(value) =>
                          handleAnswerChange(
                            question.id,
                            value as AssessmentAnswer
                          )
                        }
                        className="grid grid-cols-3 gap-0 py-4"
                      >
                        <div className="flex justify-center">
                          <RadioGroupItem value="always" id={`${question.id}-always`} />
                        </div>
                        <div className="flex justify-center">
                          <RadioGroupItem value="sometimes" id={`${question.id}-sometimes`} />
                        </div>
                        <div className="flex justify-center">
                          <RadioGroupItem value="never" id={`${question.id}-never`} />
                        </div>
                      </RadioGroup>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
