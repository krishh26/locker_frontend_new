"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const roles = ["Admin", "Trainer", "IQA", "EQA", "LIQA", "Employer", "Learner"];

const permissionCategories = [
  {
    category: "User Management",
    permissions: [
      "Create Users",
      "Edit Users",
      "Delete Users",
      "View Users",
      "Manage Admins",
    ],
  },
  {
    category: "Course Management",
    permissions: [
      "Create Courses",
      "Edit Courses",
      "Delete Courses",
      "View Courses",
      "Manage Funding Bands",
    ],
  },
  {
    category: "Learner Management",
    permissions: [
      "Create Learners",
      "Edit Learners",
      "Delete Learners",
      "View Learners",
      "Assign Learners",
    ],
  },
  {
    category: "Reports & Analytics",
    permissions: [
      "View Reports",
      "Export Data",
      "View Analytics",
      "Generate Reports",
    ],
  },
  {
    category: "System Configuration",
    permissions: [
      "System Settings",
      "Role Permissions",
      "Audit Logs",
      "Data Export",
    ],
  },
];

interface RolePermissionsTableProps {
  permissions: Record<string, Record<string, boolean>>;
  onPermissionChange: (role: string, permission: string, value: boolean) => void;
}

export function RolePermissionsTable({
  permissions,
  onPermissionChange,
}: RolePermissionsTableProps) {
  const getPermissionValue = (role: string, permission: string): boolean => {
    return permissions[role]?.[permission] ?? false;
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Permission</TableHead>
            {roles.map((role) => (
              <TableHead key={role} className="text-center">
                <Badge variant="outline">{role}</Badge>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {permissionCategories.map((category) => (
            <>
              <TableRow key={category.category} className="bg-muted/50">
                <TableCell colSpan={roles.length + 1} className="font-semibold">
                  {category.category}
                </TableCell>
              </TableRow>
              {category.permissions.map((permission) => (
                <TableRow key={permission}>
                  <TableCell className="pl-8">{permission}</TableCell>
                  {roles.map((role) => (
                    <TableCell key={role} className="text-center">
                      <Checkbox
                        checked={getPermissionValue(role, permission)}
                        onCheckedChange={(checked) =>
                          onPermissionChange(role, permission, checked as boolean)
                        }
                        disabled={role === "MasterAdmin"} // MasterAdmin has all permissions
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
