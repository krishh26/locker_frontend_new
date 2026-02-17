"use client";

import { useState, useMemo, useCallback } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  useGetIQAQuestionsQuery,
  useDeleteIQAQuestionMutation,
} from "@/store/api/iqa-questions/iqaQuestionsApi";
import type { IQAQuestion } from "@/store/api/iqa-questions/types";
import { IQAQuestionFormDialog } from "./iqa-question-form-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { HelpCircle } from "lucide-react";

interface IQAQuestionsDataTableProps {
  selectedQuestionType: string;
  onQuestionTypeChange: (type: string) => void;
  questionTypeOptions: string[];
}

export function IQAQuestionsDataTable({
  selectedQuestionType,
  onQuestionTypeChange,
  questionTypeOptions,
}: IQAQuestionsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<IQAQuestion | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<IQAQuestion | null>(null);

  const { data, isLoading, refetch } = useGetIQAQuestionsQuery({
    questionType:
      selectedQuestionType === "All" || !selectedQuestionType
        ? undefined
        : selectedQuestionType,
  });
  const [deleteQuestion, { isLoading: isDeleting }] = useDeleteIQAQuestionMutation();

  const questions = useMemo(() => {
    if (!data?.data) return [];
    if (selectedQuestionType === "All" || !selectedQuestionType) {
      return data.data;
    }
    return data.data.filter((q) => q.questionType === selectedQuestionType);
  }, [data, selectedQuestionType]);

  const handleAddNew = () => {
    if (!selectedQuestionType || selectedQuestionType === "All") {
      toast.error("Please select a question type first");
      return;
    }
    setEditingQuestion(null);
    setIsFormOpen(true);
  };

  const handleEdit = (question: IQAQuestion) => {
    setEditingQuestion(question);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (question: IQAQuestion) => {
    setQuestionToDelete(question);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!questionToDelete) return;

    try {
      await deleteQuestion(questionToDelete.id).unwrap();
      toast.success("Question deleted successfully");
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete question");
    }
  };

  const columns: ColumnDef<IQAQuestion>[] = useMemo(
    () => [
      {
        accessorKey: "index",
        header: "#",
        cell: ({ row, table }) => {
          const index = table.getRowModel().rows.findIndex((r) => r.id === row.id);
          return (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-semibold text-sm">
              {index + 1}
            </div>
          );
        },
        size: 60,
      },
      ...(selectedQuestionType === "All"
        ? [
            {
              accessorKey: "questionType",
              header: "Type",
              cell: ({ row }) => (
                <Badge variant="outline">{row.original.questionType}</Badge>
              ),
            } as ColumnDef<IQAQuestion>,
          ]
        : []),
      {
        accessorKey: "question",
        header: "Question",
        cell: ({ row }) => (
          <div className="max-w-[600px]">
            <p className="line-clamp-2">{row.original.question}</p>
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEdit(row.original)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleDeleteClick(row.original)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        ),
        size: 100,
      },
    ],
    [selectedQuestionType]
  );

  const table = useReactTable({
    data: questions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      globalFilter,
    },
  });

  return (
    <div className="space-y-4">
      {/* Question Type Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Question Type{" "}
              <Badge variant="secondary" className="ml-1">
                Required
              </Badge>
            </label>
            <Select
              value={selectedQuestionType}
              onValueChange={onQuestionTypeChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a question type to manage questions" />
              </SelectTrigger>
              <SelectContent>
                {questionTypeOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              {selectedQuestionType && selectedQuestionType !== "All" && (
                <h3 className="text-lg font-semibold mb-1">
                  Questions for "{selectedQuestionType}"
                </h3>
              )}
              <p className="text-sm text-muted-foreground">
                {questions.length} {questions.length === 1 ? "question" : "questions"}
                {selectedQuestionType === "All" && " (all types)"}
              </p>
            </div>

            <Button onClick={handleAddNew} disabled={!selectedQuestionType || selectedQuestionType === "All"}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          )}

          {/* Table */}
          {!isLoading && questions.length > 0 && (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow key={row.id}>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && questions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <HelpCircle className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
              <p className="text-sm text-muted-foreground mb-4 max-w-md">
                Get started by adding your first question for this question type.
                Click the "Add Question" button above to begin.
              </p>
              {selectedQuestionType && selectedQuestionType !== "All" && (
                <Button onClick={handleAddNew}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Question
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <IQAQuestionFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        question={editingQuestion}
        questionType={selectedQuestionType}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingQuestion(null);
          refetch();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this question? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Question"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
