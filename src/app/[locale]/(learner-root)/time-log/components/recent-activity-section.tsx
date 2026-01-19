"use client";

import { format } from "date-fns";
import { Briefcase, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface RecentActivity {
  activity_type: string;
  type: string;
  spend_time: string;
  activity_date: string;
}

interface RecentActivitySectionProps {
  activities: RecentActivity[];
}

export function RecentActivitySection({
  activities,
}: RecentActivitySectionProps) {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch {
      return dateString?.substring(0, 10) || "-";
    }
  };

  const getJobTypeBadgeProps = (type: string) => {
    if (!type) return { variant: "default" as const, className: "" };
    const lowerType = type.toLowerCase();
    if (lowerType.includes("off"))
      return {
        variant: "outline" as const,
        className: "border-orange-500 text-orange-700 bg-orange-50",
      };
    if (lowerType.includes("on"))
      return {
        variant: "default" as const,
        className: "bg-green-50 text-green-700",
      };
    return { variant: "default" as const, className: "" };
  };

  return (
    <div className="w-full space-y-4">
      {/* Header Card */}
      <div className="rounded-t-lg border border-b-0 bg-primary/10 p-4">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold">Recent Activity</h3>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-b-lg border">
        <div className="p-6">
          <div className="rounded-md border overflow-hidden max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-semibold">Activity Type</TableHead>
                  <TableHead className="font-semibold">
                    On/Off the Job Training
                  </TableHead>
                  <TableHead className="font-semibold">Time Taken</TableHead>
                  <TableHead className="font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities && activities.length > 0 ? (
                  activities.map((activity, index) => (
                    <TableRow
                      key={index}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-primary" />
                          <span className="font-medium">
                            {activity.activity_type || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {activity.type ? (
                          (() => {
                            const badgeProps = getJobTypeBadgeProps(activity.type);
                            return (
                              <Badge variant={badgeProps.variant} className={badgeProps.className}>
                                {activity.type}
                              </Badge>
                            );
                          })()
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">
                            {activity.spend_time || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{formatDate(activity.activity_date)}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <span className="text-muted-foreground">
                        No recent activity found
                      </span>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
