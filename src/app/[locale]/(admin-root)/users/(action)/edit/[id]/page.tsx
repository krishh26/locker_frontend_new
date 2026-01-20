"use client";
import { useEffect } from "react";

import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";;

import { UserCog } from "lucide-react";

import { useGetUsersQuery } from "@/store/api/user/userApi";

import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/dashboard/page-header";

import { UsersForm } from "../../../components/users-form";
import { useAppSelector } from "@/store/hooks";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;
  const user = useAppSelector((state) => state.auth.user);
  const isEmployer = user?.role === "Employer";

  // Fetch users and find the one with matching ID
  const { data, isLoading, error } = useGetUsersQuery({
    page: 1,
    page_size: 1000,
  });

  const userToEdit = data?.data?.find((u) => u.user_id.toString() === userId);

  useEffect(() => {
    if (isEmployer) {
      router.push("/users");
    } else if (!isLoading && !userToEdit && data) {
      // User not found, redirect to users page
      router.push("/users");
    }
  }, [isEmployer, isLoading, userToEdit, data, router]);

  if (isLoading) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader
          title="Edit User"
          subtitle="Update user information below"
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

  if (isEmployer) {
    return null;
  }

  if (error || !userToEdit) {
    return (
      <div className="space-y-6 px-4 lg:px-6 pb-8">
        <PageHeader
          title="Edit User"
          subtitle="Update user information below"
          icon={UserCog}
          showBackButton
          backButtonHref="/users"
        />
        <div className="">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
            <p className="text-destructive">User not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Edit User"
        subtitle="Update user information below"
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
