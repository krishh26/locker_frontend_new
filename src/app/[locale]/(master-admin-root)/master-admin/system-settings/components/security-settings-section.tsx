"use client";

import { useForm } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface SecuritySettings {
  password_min_length: number;
  password_require_uppercase: boolean;
  password_require_lowercase: boolean;
  password_require_numbers: boolean;
  password_require_special: boolean;
  session_timeout: number;
  require_2fa: boolean;
  max_login_attempts: number;
  lockout_duration: number;
}

export function SecuritySettingsSection() {
  const form = useForm<SecuritySettings>({
    defaultValues: {
      password_min_length: 6,
      password_require_uppercase: true,
      password_require_lowercase: true,
      password_require_numbers: true,
      password_require_special: false,
      session_timeout: 30,
      require_2fa: false,
      max_login_attempts: 5,
      lockout_duration: 15,
    },
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Password Policy</h3>
        <div className="grid gap-2">
          <Label htmlFor="password_min_length">Minimum Password Length</Label>
          <Input
            id="password_min_length"
            type="number"
            {...form.register("password_min_length", { valueAsNumber: true })}
            min={6}
            max={32}
          />
        </div>
        <div className="space-y-2">
          <Label>Password Requirements</Label>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="password_require_uppercase"
              checked={form.watch("password_require_uppercase")}
              onCheckedChange={(checked) =>
                form.setValue("password_require_uppercase", checked as boolean)
              }
            />
            <Label htmlFor="password_require_uppercase" className="cursor-pointer">
              Require uppercase letters
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="password_require_lowercase"
              checked={form.watch("password_require_lowercase")}
              onCheckedChange={(checked) =>
                form.setValue("password_require_lowercase", checked as boolean)
              }
            />
            <Label htmlFor="password_require_lowercase" className="cursor-pointer">
              Require lowercase letters
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="password_require_numbers"
              checked={form.watch("password_require_numbers")}
              onCheckedChange={(checked) =>
                form.setValue("password_require_numbers", checked as boolean)
              }
            />
            <Label htmlFor="password_require_numbers" className="cursor-pointer">
              Require numbers
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="password_require_special"
              checked={form.watch("password_require_special")}
              onCheckedChange={(checked) =>
                form.setValue("password_require_special", checked as boolean)
              }
            />
            <Label htmlFor="password_require_special" className="cursor-pointer">
              Require special characters
            </Label>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Session Management</h3>
        <div className="grid gap-2">
          <Label htmlFor="session_timeout">Session Timeout (minutes)</Label>
          <Input
            id="session_timeout"
            type="number"
            {...form.register("session_timeout", { valueAsNumber: true })}
            min={5}
            max={1440}
          />
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="require_2fa"
            checked={form.watch("require_2fa")}
            onCheckedChange={(checked) =>
              form.setValue("require_2fa", checked as boolean)
            }
          />
          <Label htmlFor="require_2fa" className="cursor-pointer">
            Require 2FA for all users
          </Label>
        </div>
      </div>

      <div className="grid gap-4">
        <h3 className="text-lg font-semibold">Account Lockout</h3>
        <div className="grid gap-2">
          <Label htmlFor="max_login_attempts">Max Login Attempts</Label>
          <Input
            id="max_login_attempts"
            type="number"
            {...form.register("max_login_attempts", { valueAsNumber: true })}
            min={3}
            max={10}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lockout_duration">Lockout Duration (minutes)</Label>
          <Input
            id="lockout_duration"
            type="number"
            {...form.register("lockout_duration", { valueAsNumber: true })}
            min={5}
            max={1440}
          />
        </div>
      </div>
    </div>
  );
}
