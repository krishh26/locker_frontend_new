"use client";

import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GeneralSettings {
  site_name: string;
  timezone: string;
  date_format: string;
  time_format: string;
  language: string;
}

export function GeneralSettingsSection() {
  const form = useForm<GeneralSettings>({
    defaultValues: {
      site_name: "",
      timezone: "UTC",
      date_format: "YYYY-MM-DD",
      time_format: "24h",
      language: "en",
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="site_name">Site Name</Label>
          <Input
            id="site_name"
            {...form.register("site_name")}
            placeholder="Locker LMS"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            value={form.watch("timezone")}
            onValueChange={(value) => form.setValue("timezone", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UTC">UTC</SelectItem>
              <SelectItem value="America/New_York">America/New_York</SelectItem>
              <SelectItem value="America/Chicago">America/Chicago</SelectItem>
              <SelectItem value="America/Denver">America/Denver</SelectItem>
              <SelectItem value="America/Los_Angeles">America/Los_Angeles</SelectItem>
              <SelectItem value="Europe/London">Europe/London</SelectItem>
              <SelectItem value="Europe/Paris">Europe/Paris</SelectItem>
              <SelectItem value="Asia/Dubai">Asia/Dubai</SelectItem>
              <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
              <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
              <SelectItem value="Australia/Sydney">Australia/Sydney</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="date_format">Date Format</Label>
          <Select
            value={form.watch("date_format")}
            onValueChange={(value) => form.setValue("date_format", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select date format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
              <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
              <SelectItem value="DD-MM-YYYY">DD-MM-YYYY</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="time_format">Time Format</Label>
          <Select
            value={form.watch("time_format")}
            onValueChange={(value) => form.setValue("time_format", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select time format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">24 Hour</SelectItem>
              <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="language">Default Language</Label>
          <Select
            value={form.watch("language")}
            onValueChange={(value) => form.setValue("language", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
