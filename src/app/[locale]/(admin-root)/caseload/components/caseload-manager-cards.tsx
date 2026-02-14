"use client";

import { useState } from "react";
import {
  Users,
  GraduationCap,
  Mail,
  ChevronDown,
  ChevronUp,
  Download,
  FileText,
  Table2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import type { CaseloadItem } from "@/store/api/caseload/types";
import jsPDF from "jspdf";
import { applyPlugin } from "jspdf-autotable";
import { ScrollArea } from "@/components/ui/scroll-area";

// Apply the autotable plugin to jsPDF
applyPlugin(jsPDF);

interface CaseloadManagerCardsProps {
  lineManagers: CaseloadItem[];
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CaseloadManagerCards({
  lineManagers,
  currentPage,
  totalPages,
  onPageChange,
}: CaseloadManagerCardsProps) {
  const [expandedManager, setExpandedManager] = useState<string | null>(null);

  const handleManagerToggle = (managerId: string) => {
    setExpandedManager(expandedManager === managerId ? null : managerId);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (count: number) => {
    if (count === 0) return "destructive";
    if (count < 5) return "default";
    if (count < 10) return "default";
    return "default";
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Caseload Management Report", 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    let yPosition = 45;
    lineManagers.forEach((manager, idx) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.text(`${idx + 1}. ${manager.line_manager.full_name}`, 14, yPosition);
      doc.setFontSize(10);
      doc.text(`Email: ${manager.line_manager.email}`, 20, yPosition + 8);
      doc.text(
        `Total Learners: ${manager.statistics.total_managed_learners}`,
        20,
        yPosition + 16
      );
      doc.text(
        `Total Users: ${manager.statistics.total_managed_users}`,
        20,
        yPosition + 24
      );

      if (manager.managed_users && manager.managed_users.length > 0) {
        (doc as any).autoTable({
          startY: yPosition + 30,
          head: [["Name", "Email", "Role"]],
          body: manager.managed_users.map((u) => [
            `${u.first_name} ${u.last_name}`,
            u.email,
            u.role || "User",
          ]),
          theme: "grid",
          margin: { left: 20 },
        });
        yPosition = (doc as any).lastAutoTable.finalY + 20;
      } else {
        yPosition += 50;
      }
    });

    doc.save("caseload-report.pdf");
  };

  const handleExportCSV = () => {
    const csvHeaders = [
      "Line Manager Name",
      "Managed User Email",
      "Total Learners",
      "Total Users",
    ];

    let csvContent = csvHeaders.join(",") + "\n";

    lineManagers.forEach((manager) => {
      let managedUserEmails = "";
      if (manager.managed_users && manager.managed_users.length > 0) {
        managedUserEmails = manager.managed_users
          .map((user) => user.email)
          .join(",");
      }

      const rowData = [
        manager.line_manager.full_name,
        managedUserEmails,
        manager.statistics.total_managed_learners,
        manager.statistics.total_managed_users,
      ];

      csvContent += rowData.map((field) => `"${field}"`).join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `caseload-report-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportManagerPDF = (manager: CaseloadItem) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(
      `${manager.line_manager.full_name} - Caseload Report`,
      14,
      20
    );
    doc.setFontSize(12);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);

    let yPosition = 45;

    doc.setFontSize(14);
    doc.text("Manager Information:", 14, yPosition);
    doc.setFontSize(10);
    doc.text(
      `Name: ${manager.line_manager.full_name}`,
      20,
      yPosition + 8
    );
    doc.text(`Email: ${manager.line_manager.email}`, 20, yPosition + 16);
    doc.text(
      `Total Learners: ${manager.statistics.total_managed_learners}`,
      20,
      yPosition + 24
    );
    doc.text(
      `Total Users: ${manager.statistics.total_managed_users}`,
      20,
      yPosition + 32
    );

    yPosition += 50;

    if (manager.managed_users && manager.managed_users.length > 0) {
      doc.setFontSize(14);
      doc.text("Managed Users:", 14, yPosition);
      yPosition += 10;
      (doc as any).autoTable({
        startY: yPosition,
        head: [["Name", "Email", "Role"]],
        body: manager.managed_users.map((u) => [
          `${u.first_name} ${u.last_name}`,
          u.email,
          u.role || "User",
        ]),
        theme: "grid",
        margin: { left: 14 },
      });
    } else {
      doc.setFontSize(12);
      doc.text("No users assigned to this manager.", 14, yPosition);
    }

    doc.save(
      `${manager.line_manager.full_name.replace(/\s+/g, "-")}-caseload-report.pdf`
    );
  };

  const handleExportManagerCSV = (manager: CaseloadItem) => {
    const csvHeaders = [
      "Manager Name",
      "Manager Email",
      "User Name",
      "User Email",
      "User Role",
      "Total Learners",
      "Total Users",
    ];

    let csvContent = csvHeaders.join(",") + "\n";

    if (manager.managed_users && manager.managed_users.length > 0) {
      manager.managed_users.forEach((user) => {
        const rowData = [
          manager.line_manager.full_name,
          manager.line_manager.email,
          `${user.first_name} ${user.last_name}`,
          user.email,
          user.role || "User",
          manager.statistics.total_managed_learners,
          manager.statistics.total_managed_users,
        ];
        csvContent += rowData.map((field) => `"${field}"`).join(",") + "\n";
      });
    } else {
      const rowData = [
        manager.line_manager.full_name,
        manager.line_manager.email,
        "No users assigned",
        "",
        "",
        manager.statistics.total_managed_learners,
        manager.statistics.total_managed_users,
      ];
      csvContent += rowData.map((field) => `"${field}"`).join(",") + "\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `${manager.line_manager.full_name.replace(/\s+/g, "-")}-caseload-report.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <Table2 className="h-4 w-4 mr-2" />
              Export CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Manager Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lineManagers.map((manager) => {
          const managerId = String(manager.line_manager.user_id);
          const isExpanded = expandedManager === managerId;

          return (
            <Card key={managerId} className="bg-primary border-primary hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(manager.line_manager.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-lg truncate text-white">
                        {manager.line_manager.full_name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-white/70 mt-1">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{manager.line_manager.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-1 shrink-0">
                    {manager.statistics.total_managed_users > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-white hover:text-white/80 hover:bg-white/10">
                            <Download className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleExportManagerCSV(manager)}
                          >
                            <Table2 className="h-4 w-4 mr-2" />
                            Export CSV
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleExportManagerPDF(manager)}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Export PDF
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-white hover:text-white/80 hover:bg-white/10"
                      onClick={() => handleManagerToggle(managerId)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Statistics Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <Users className="h-5 w-5 mx-auto mb-1 text-white" />
                    <div className="text-2xl font-bold text-white">
                      {manager.statistics.total_managed_users}
                    </div>
                    <div className="text-xs text-white/70">Users</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3 text-center">
                    <GraduationCap className="h-5 w-5 mx-auto mb-1 text-white" />
                    <div className="text-2xl font-bold text-white">
                      {manager.statistics.total_managed_learners}
                    </div>
                    <div className="text-xs text-white/70">Learners</div>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="flex justify-center">
                  <Badge variant={getStatusColor(manager.statistics.total_managed_users) as "secondary" | "default" | "destructive" | "outline" | null | undefined}>
                    {manager.statistics.total_managed_users} Users
                  </Badge>
                </div>

                {/* Expandable User List */}
                {isExpanded && (
                  <div className="pt-4 border-t border-white/20">
                    <h4 className="text-sm font-semibold mb-3 text-white">
                      Managed Users ({manager.managed_users?.length || 0})
                    </h4>
                    {manager.managed_users && manager.managed_users.length > 0 ? (
                      <ScrollArea className="h-[300px]">
                        <div className="space-y-2">
                          {manager.managed_users.map((user) => (
                            <div
                              key={user.user_id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-white/10 text-white text-xs">
                                  {getInitials(`${user.first_name} ${user.last_name}`)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate text-white">
                                  {user.first_name} {user.last_name}
                                </div>
                                <div className="text-xs text-white/70 truncate">
                                  {user.email}
                                </div>
                              </div>
                              {user.role && (
                                <Badge variant="outline" className="text-xs">
                                  {user.role}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="text-center py-6 text-white/70 rounded-lg bg-white/10">
                        <Users className="h-8 w-8 mx-auto mb-2 text-white/40" />
                        <p className="text-sm">No users assigned yet</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                  className={
                    currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"
                  }
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => {
                const page = i + 1;
                return (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => onPageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
