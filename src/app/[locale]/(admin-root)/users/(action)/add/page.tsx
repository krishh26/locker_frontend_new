"use client";
import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { UserPlus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { UsersForm } from "../../components/users-form";
import { useAppSelector } from "@/store/hooks";
import { useTranslations } from "next-intl";

export default function AddUserPage() {
  const router = useRouter();
  const t = useTranslations("users.pages");
  const user = useAppSelector((state) => state.auth.user);
  const isEmployer = user?.role === "Employer";

  useEffect(() => {
    if (isEmployer) {
      router.push("/users");
    }
  }, [isEmployer, router]);

  if (isEmployer) {
    return null;
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("createTitle")}
        subtitle={t("createSubtitle")}
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
