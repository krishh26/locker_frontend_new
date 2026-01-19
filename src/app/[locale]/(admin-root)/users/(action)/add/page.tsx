"use client";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsersForm } from "../../components/users-form";

export default function AddUserPage() {
  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Create New User"
        subtitle="Fill in the form below to create a new user"
        icon={UserPlus}
        showBackButton
        backButtonHref="/users"
      />
      <div className="">
        <UsersForm user={null} />
      </div>
    </div>
  );
}
