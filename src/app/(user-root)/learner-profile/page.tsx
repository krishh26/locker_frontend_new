"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { LearnerProfilePageContent } from "./components/learner-profile-page-content";
import { Skeleton } from "@/components/ui/skeleton";

function LearnerProfileContent() {
  const searchParams = useSearchParams();
  const learnerId = searchParams.get("learner_id");

  return <LearnerProfilePageContent learnerId={learnerId} />;
}

export default function LearnerProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6 px-4 lg:px-6 pb-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      }
    >
      <LearnerProfileContent />
    </Suspense>
  );
}

