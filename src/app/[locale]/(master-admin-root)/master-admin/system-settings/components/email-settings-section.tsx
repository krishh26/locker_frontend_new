"use client";

import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface EmailSettings {
  smtp_host: string;
  smtp_port: string;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: string;
  from_email: string;
  from_name: string;
  enable_notifications: boolean;
}

export function EmailSettingsSection() {
  const form = useForm<EmailSettings>({
    defaultValues: {
      smtp_host: "",
      smtp_port: "587",
      smtp_username: "",
      smtp_password: "",
      smtp_encryption: "tls",
      from_email: "",
      from_name: "",
      enable_notifications: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">SMTP Configuration</h3>
        <div className="grid gap-2">
          <Label htmlFor="smtp_host">SMTP Host</Label>
          <Input
            id="smtp_host"
            {...form.register("smtp_host")}
            placeholder="smtp.example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="smtp_port">SMTP Port</Label>
          <Input
            id="smtp_port"
            type="number"
            {...form.register("smtp_port")}
            placeholder="587"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="smtp_username">SMTP Username</Label>
          <Input
            id="smtp_username"
            {...form.register("smtp_username")}
            placeholder="your-email@example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="smtp_password">SMTP Password</Label>
          <Input
            id="smtp_password"
            type="password"
            {...form.register("smtp_password")}
            placeholder="••••••••"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="smtp_encryption">Encryption</Label>
          <select
            id="smtp_encryption"
            {...form.register("smtp_encryption")}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
          >
            <option value="tls">TLS</option>
            <option value="ssl">SSL</option>
            <option value="none">None</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Email Templates</h3>
        <div className="grid gap-2">
          <Label htmlFor="from_email">From Email</Label>
          <Input
            id="from_email"
            type="email"
            {...form.register("from_email")}
            placeholder="noreply@example.com"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="from_name">From Name</Label>
          <Input
            id="from_name"
            {...form.register("from_name")}
            placeholder="Locker LMS"
          />
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Notification Preferences</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="enable_notifications"
            checked={form.watch("enable_notifications")}
            onCheckedChange={(checked) =>
              form.setValue("enable_notifications", checked as boolean)
            }
          />
          <Label htmlFor="enable_notifications" className="cursor-pointer">
            Enable email notifications
          </Label>
        </div>
      </div>
    </div>
  );
}
