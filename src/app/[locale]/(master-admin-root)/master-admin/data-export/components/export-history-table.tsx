"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Placeholder type - will be replaced with actual API types
interface ExportHistory {
  id: number;
  created_at: string;
  data_types: string[];
  format: string;
  status: "completed" | "processing" | "failed";
  file_url?: string;
  created_by: string;
}

export function ExportHistoryTable() {
  // Placeholder data - will be replaced with actual API call
  const isLoading = false;
  const data: ExportHistory[] = [];

  const handleDownload = (exportItem: ExportHistory) => {
    if (exportItem.file_url) {
      // Placeholder - will trigger download
      window.open(exportItem.file_url, "_blank");
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Created</TableHead>
            <TableHead>Data Types</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            ))
          ) : data.length > 0 ? (
            data.map((exportItem) => (
              <TableRow key={exportItem.id}>
                <TableCell>
                  {new Date(exportItem.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {exportItem.data_types.map((type) => (
                      <Badge key={type} variant="outline">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{exportItem.format.toUpperCase()}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      exportItem.status === "completed"
                        ? "default"
                        : exportItem.status === "processing"
                        ? "secondary"
                        : "destructive"
                    }
                  >
                    {exportItem.status}
                  </Badge>
                </TableCell>
                <TableCell>{exportItem.created_by}</TableCell>
                <TableCell className="text-right">
                  {exportItem.status === "completed" && exportItem.file_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(exportItem)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No export history found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
