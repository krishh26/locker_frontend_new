"use client";

import { useState } from "react";
import { Settings, Save } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GeneralSettingsSection } from "./general-settings-section";
import { EmailSettingsSection } from "./email-settings-section";
import { SecuritySettingsSection } from "./security-settings-section";
import { toast } from "sonner";

export function SystemSettingsPageContent() {
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Placeholder - will be replaced with actual API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      {/* Page Header */}
      <PageHeader
        title="System Settings"
        subtitle="Configure system-wide settings, email, and security policies"
        icon={Settings}
        showBackButton
        backButtonHref="/master-admin"
      />

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <TabsContent value="general" className="mt-6">
          <GeneralSettingsSection />
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <EmailSettingsSection />
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecuritySettingsSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
