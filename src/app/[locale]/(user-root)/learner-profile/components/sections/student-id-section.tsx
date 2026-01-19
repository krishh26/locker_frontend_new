"use client";

import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { LearnerData } from "@/store/api/learner/types";

interface StudentIdSectionProps {
  learner: LearnerData;
  canEdit?: boolean;
}

export function StudentIdSection({ learner, canEdit = false }: StudentIdSectionProps) {
  const form = useFormContext();
  const uln = (learner as { uln?: string }).uln || "";
  const misLearnerId = (learner as { mis_learner_id?: string }).mis_learner_id || "";
  const studentId = (learner as { student_id?: string }).student_id || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student ID</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">ULN</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("uln")}
                  className=""
                />
                {form.formState.errors.uln && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.uln.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {uln || "-"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">MIS Learner ID</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("mis_learner_id")}
                  className=""
                />
                {form.formState.errors.mis_learner_id && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.mis_learner_id.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {misLearnerId || "-"}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Student ID</Label>
            {canEdit ? (
              <>
                <Input
                  type="text"
                  {...form.register("student_id")}
                  className=""
                />
                {form.formState.errors.student_id && (
                  <p className="text-destructive text-sm">
                    {form.formState.errors.student_id.message as string}
                  </p>
                )}
              </>
            ) : (
              <div className="flex items-center">
                {studentId || "-"}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

