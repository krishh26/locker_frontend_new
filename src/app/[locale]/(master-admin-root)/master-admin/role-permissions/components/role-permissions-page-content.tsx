"use client";

import { useState } from "react";
import { Key, Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { RolePermissionsTable } from "./role-permissions-table";
import { toast } from "sonner";

export function RolePermissionsPageContent() {
  const [isSaving, setIsSaving] = useState(false);
  const [permissions, setPermissions] = useState<Record<string, Record<string, boolean>>>({});

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Placeholder - will be replaced with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Permissions updated successfully");
    } catch (error) {
      toast.error("Failed to update permissions");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionChange = (role: string, permission: string, value: boolean) => {
    setPermissions((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        [permission]: value,
      },
    }));
  };

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Role Permissions"
        subtitle="Manage role-based access control and permissions matrix"
        icon={Key}
        showBackButton
        backButtonHref="/master-admin"
      />

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Permissions Table */}
      <RolePermissionsTable
        permissions={permissions}
        onPermissionChange={handlePermissionChange}
      />
    </div>
  );
}
