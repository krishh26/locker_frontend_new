"use client";
import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";

import { UserCog } from "lucide-react";

import { useGetUserByIdQuery } from "@/store/api/user/userApi";

import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";

import { UsersForm } from "../../../components/users-form";
import { useAppSelector } from "@/store/hooks";
import { useTranslations } from "next-intl";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("users.pages");
  const userId = params.id as string;
  const authUser = useAppSelector((state) => state.auth.user);
  const isEmployer = authUser?.role === "Employer";

  // Parse userId to number
  const userIdNumber = parseInt(userId, 10);
  const isValidUserId = !isNaN(userIdNumber) && userIdNumber > 0;

  // Fetch user by ID
  const { data, isLoading, error } = useGetUserByIdQuery(userIdNumber, {
    skip: !isValidUserId || isEmployer,
  });

  const userToEdit = data?.data;

  useEffect(() => {
    if (isEmployer) {
      router.push("/users");
    } else if (!isValidUserId) {
      // Invalid user ID, redirect to users page
      router.push("/users");
    } else if (!isLoading && error) {
      // Error fetching user, redirect to users page
      router.push("/users");
    }
  }, [isEmployer, isLoading, error, isValidUserId, router]);

  if (isEmployer || !isValidUserId) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader
          title={t("editTitle")}
          subtitle={t("editSubtitle")}
          icon={UserCog}
          showBackButton
          backButtonHref="/users"
        />
        <div className="space-y-6">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error || !userToEdit) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader
          title={t("editTitle")}
          subtitle={t("editSubtitle")}
          icon={UserCog}
          showBackButton
          backButtonHref="/users"
        />
        <div className="">
          <div className="rounded-lg border border-destructive bg-destructive p-4 text-center">
            <p className="text-white">
              {error ? "Failed to load user" : t("userNotFound")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("editTitle")}
        subtitle={t("editSubtitle")}
        icon={UserCog}
        showBackButton
        backButtonHref="/users"
      />
      <div className="">
        <UsersForm user={userToEdit} />
      </div>
    </div>
  );
}
