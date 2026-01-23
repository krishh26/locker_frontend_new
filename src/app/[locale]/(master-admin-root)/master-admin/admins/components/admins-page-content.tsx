"use client";

import { useState } from "react";
import { Users, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { AdminsDataTable } from "./admins-data-table";
import { AdminFormDialog } from "./admin-form-dialog";

export function AdminsPageContent() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<{ user_id: number; email: string; first_name: string; last_name: string; user_name: string; status?: string } | null>(null);

  const handleCreate = () => {
    setEditingAdmin(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (admin: { user_id: number; email: string; first_name: string; last_name: string; user_name: string; status?: string }) => {
    setEditingAdmin(admin);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingAdmin(null);
  };

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="Manage Administrators"
        subtitle="Create, edit, and manage Administrator user accounts"
        icon={Users}
        showBackButton
        backButtonHref="/master-admin"
      />

      {/* Action Bar */}
      <div className="flex justify-end">
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Admin
        </Button>
      </div>

      {/* Data Table */}
      <div className="@container/main">
        <AdminsDataTable onEdit={handleEdit} />
      </div>

      {/* Create/Edit Dialog */}
      <AdminFormDialog
        open={isDialogOpen}
        onOpenChange={handleDialogClose}
        admin={editingAdmin}
        onSuccess={() => {
          handleDialogClose();
          // Refetch will be handled by the data table
        }}
      />
    </div>
  );
}
