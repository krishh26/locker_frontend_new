"use client";

import { useState, useMemo } from "react";
import {
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useGetPendingSignaturesQuery } from "@/store/api/documents-to-sign/documentsToSignApi";
import { useAppSelector } from "@/store/hooks";
import { SignatureModal } from "./signature-modal";
import type { DocumentToSign } from "@/store/api/documents-to-sign/types";

interface TransformedDocument {
  id: string;
  courseName: string;
  type: string;
  dateUploaded: string;
  documentName: string;
  uploadedBy: string;
  signatures: {
    employer?: { signed: boolean; name?: string; date?: string };
    iqa?: { signed: boolean; name?: string; date?: string };
    trainer?: { signed: boolean; name?: string; date?: string };
    learner?: { signed: boolean; name?: string; date?: string };
  };
  requestedSignatures: Array<{ role: string; is_requested: boolean }>;
  sessionDateTime: string;
}

export function LearnersDocumentsToSignDataTable() {
  const user = useAppSelector((state) => state.auth.user);
  const userId = user?.id || "";
  const [selectedDocument, setSelectedDocument] =
    useState<TransformedDocument | null>(null);
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    data: pendingSignatureData,
    isLoading,
    refetch,
  } = useGetPendingSignaturesQuery({ id: userId }, { skip: !userId });

  // Transform API data to component format
  const documents = useMemo((): TransformedDocument[] => {
    if (!pendingSignatureData?.data) return [];

    return pendingSignatureData.data.map((item: DocumentToSign) => ({
      id: item.assignment_id,
      courseName: item.course_name,
      type: item.type || "Evidence",
      dateUploaded: item.assignment_created_at,
      documentName: item.assignment_name,
      uploadedBy:
        user?.firstName && user?.lastName
          ? `${user.firstName} ${user.lastName}`
          : user?.email || "Unknown",
      signatures: {
        employer: {
          signed:
            item.signatures?.find((s) => s.role === "Employer")?.is_signed ||
            false,
          name:
            item.signatures?.find((s) => s.role === "Employer")?.name || "",
          date:
            item.signatures?.find((s) => s.role === "Employer")?.signed_at ||
            "",
        },
        iqa: {
          signed:
            item.signatures?.find((s) => s.role === "IQA")?.is_signed || false,
          name: item.signatures?.find((s) => s.role === "IQA")?.name || "",
          date:
            item.signatures?.find((s) => s.role === "IQA")?.signed_at || "",
        },
        trainer: {
          signed:
            item.signatures?.find((s) => s.role === "Trainer")?.is_signed ||
            false,
          name:
            item.signatures?.find((s) => s.role === "Trainer")?.name || "",
          date:
            item.signatures?.find((s) => s.role === "Trainer")?.signed_at ||
            "",
        },
        learner: {
          signed:
            item.signatures?.find((s) => s.role === "Learner")?.is_signed ||
            false,
          name:
            item.signatures?.find((s) => s.role === "Learner")?.name || "",
          date:
            item.signatures?.find((s) => s.role === "Learner")?.signed_at ||
            "",
        },
      },
      requestedSignatures:
        item.signatures?.filter((s) => s.is_requested) || [],
      sessionDateTime: "N/A",
    }));
  }, [pendingSignatureData, user]);

  const formatDate = (dateString: string) => {
    if (!dateString || dateString === "N/A") return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSignatureStatus = (
    signatures: TransformedDocument["signatures"],
    requestedSignatures: TransformedDocument["requestedSignatures"]
  ) => {
    const signedRoles: string[] = [];

    requestedSignatures?.forEach((reqSig) => {
      const signature = signatures[reqSig.role.toLowerCase() as keyof typeof signatures];
      if (signature?.signed) {
        signedRoles.push(reqSig.role);
      }
    });

    return signedRoles;
  };

  const handleSignDocument = (document: TransformedDocument) => {
    setSelectedDocument(document);
    setSignatureModalOpen(true);
  };

  const handleSaveSignatures = async () => {
    await refetch();
  };

  const columns: ColumnDef<TransformedDocument>[] = useMemo(
    () => [
      {
        accessorKey: "courseName",
        header: "Course Name",
        cell: ({ row }) => (
          <div className="font-medium max-w-[200px] truncate">
            {row.getValue("courseName")}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        cell: ({ row }) => {
          const type = row.getValue("type") as string;
          return (
            <Badge
              variant={type === "Evidence" ? "default" : "secondary"}
              className="text-xs"
            >
              {type}
            </Badge>
          );
        },
      },
      {
        accessorKey: "dateUploaded",
        header: "Date Uploaded",
        cell: ({ row }) => (
          <div className="text-sm">{formatDate(row.getValue("dateUploaded"))}</div>
        ),
      },
      {
        accessorKey: "documentName",
        header: "Document Name",
        cell: ({ row }) => (
          <div className="font-medium max-w-[200px] truncate">
            {row.getValue("documentName")}
          </div>
        ),
      },
      {
        accessorKey: "uploadedBy",
        header: "Uploaded By",
        cell: ({ row }) => (
          <div className="text-sm">{row.getValue("uploadedBy")}</div>
        ),
      },
      {
        accessorKey: "signatures",
        header: "Signed in Agreement",
        cell: ({ row }) => {
          const document = row.original;
          const signedRoles = getSignatureStatus(
            document.signatures,
            document.requestedSignatures
          );

          return (
            <div className="flex flex-wrap gap-1">
              {document.requestedSignatures?.length > 0 ? (
                <>
                  {signedRoles.map((role, index) => (
                    <Badge
                      key={`signed-${index}`}
                      variant="default"
                      className="text-[10px] h-5 bg-green-600 hover:bg-green-700"
                    >
                      {role}
                    </Badge>
                  ))}
                  {document.requestedSignatures
                    ?.filter((reqSig) => {
                      const signature =
                        document.signatures[
                          reqSig.role.toLowerCase() as keyof typeof document.signatures
                        ];
                      return !signature?.signed;
                    })
                    .map((reqSig, index) => (
                      <Badge
                        key={`pending-${index}`}
                        variant="outline"
                        className="text-[9px] h-[18px] border-yellow-500 text-yellow-700 dark:text-yellow-400"
                      >
                        {reqSig.role} (Pending)
                      </Badge>
                    ))}
                </>
              ) : (
                <span className="text-sm text-muted-foreground italic">
                  No signatures requested
                </span>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: "sessionDateTime",
        header: "Session Date/Time",
        cell: ({ row }) => (
          <div className="text-sm">{row.getValue("sessionDateTime")}</div>
        ),
      },
      {
        id: "actions",
        header: "Action",
        cell: ({ row }) => {
          const document = row.original;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSignDocument(document)}
              className="text-primary hover:text-primary"
            >
              Sign
            </Button>
          );
        },
      },
    ],
    []
  );

  const table = useReactTable({
    data: documents,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={globalFilter ?? ""}
              onChange={(event) => setGlobalFilter(String(event.target.value))}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No documents found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <DataTablePagination table={table} showSelectedRows={false} />

      {/* Summary */}
      <div className="rounded-lg border bg-muted/50 p-4">
        <div className="text-sm text-muted-foreground">
          Total documents: <strong className="text-foreground">{documents.length}</strong>
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          Documents requiring signatures:{" "}
          <strong className="text-foreground">
            {
              documents.filter((doc) => {
                return doc.requestedSignatures?.some((reqSig) => {
                  const signature =
                    doc.signatures[reqSig.role.toLowerCase() as keyof typeof doc.signatures];
                  return !signature?.signed;
                });
              }).length
            }
          </strong>
        </div>
      </div>

      {/* Signature Modal */}
      {selectedDocument && (
        <SignatureModal
          open={signatureModalOpen}
          onClose={() => setSignatureModalOpen(false)}
          document={{
            id: selectedDocument.id,
            documentName: selectedDocument.documentName,
            courseName: selectedDocument.courseName,
            signatures: selectedDocument.signatures,
            requestedSignatures: selectedDocument.requestedSignatures,
          }}
          onSave={handleSaveSignatures}
        />
      )}
    </div>
  );
}

