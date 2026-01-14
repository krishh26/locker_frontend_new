"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import {
  useGetSessionTypesQuery,
  useDeleteSessionTypeMutation,
  useToggleSessionTypeMutation,
  useReorderSessionTypeMutation,
} from "@/store/api/session-type/sessionTypeApi";
import type { SessionType } from "@/store/api/session-type/types";
import { SessionTypeFormDialog } from "./session-type-form-dialog";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface SortableRowProps {
  sessionType: SessionType;
  onEdit: (sessionType: SessionType) => void;
  onDelete: (id: number) => void;
  onToggleActive: (id: number, isActive: boolean) => void;
}

function SortableTableRow({
  sessionType,
  onEdit,
  onDelete,
  onToggleActive,
}: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sessionType.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? "bg-muted" : ""}>
      <TableCell className="w-[50px]">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing flex items-center"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      </TableCell>
      <TableCell className="w-[80px] font-medium">{sessionType.order}</TableCell>
      <TableCell>
        <span className="font-medium">{sessionType.name}</span>
      </TableCell>
      <TableCell align="center">
        <Badge variant={sessionType.isOffTheJob ? "default" : "secondary"}>
          {sessionType.isOffTheJob ? "Yes" : "No"}
        </Badge>
      </TableCell>
      <TableCell align="center">
        <Switch
          checked={sessionType.isActive}
          onCheckedChange={(checked) => onToggleActive(sessionType.id, checked)}
        />
      </TableCell>
      <TableCell align="center">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(sessionType)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(sessionType.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export function SessionTypesDataTable() {
  const [sessionTypes, setSessionTypes] = useState<SessionType[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSessionType, setEditingSessionType] = useState<SessionType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sessionTypeToDelete, setSessionTypeToDelete] = useState<number | null>(null);

  const { data, isLoading, refetch } = useGetSessionTypesQuery();
  const [deleteSessionType, { isLoading: isDeleting }] = useDeleteSessionTypeMutation();
  const [toggleSessionType] = useToggleSessionTypeMutation();
  const [reorderSessionType] = useReorderSessionTypeMutation();

  // Update local state when data changes
  useEffect(() => {
    if (data?.data) {
      const sorted = [...data.data].sort((a, b) => a.order - b.order);
      setSessionTypes(sorted);
    }
  }, [data]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleAddNew = () => {
    setEditingSessionType(null);
    setIsFormOpen(true);
  };

  const handleEdit = (sessionType: SessionType) => {
    setEditingSessionType(sessionType);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setSessionTypeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!sessionTypeToDelete) return;

    try {
      await deleteSessionType(sessionTypeToDelete).unwrap();
      toast.success("Session Type deleted successfully");
      setDeleteDialogOpen(false);
      setSessionTypeToDelete(null);
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to delete session type");
    }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await toggleSessionType({ id, isActive }).unwrap();
      toast.success(
        `Session Type ${isActive ? "activated" : "deactivated"} successfully`
      );
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to update status");
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = sessionTypes.findIndex((st) => st.id === active.id);
    const newIndex = sessionTypes.findIndex((st) => st.id === over.id);

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    // Optimistically update UI
    const newOrder = arrayMove(sessionTypes, oldIndex, newIndex);
    setSessionTypes(newOrder);

    // Determine direction and call API
    const direction = newIndex < oldIndex ? "UP" : "DOWN";
    const itemId = active.id as number;

    try {
      await reorderSessionType({ id: itemId, direction }).unwrap();
      toast.success("Order updated successfully");
      refetch();
    } catch (error: any) {
      // Revert on error
      setSessionTypes(sessionTypes);
      toast.error(error?.data?.message || "Failed to update order");
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold mb-1">Session Types</h3>
              <p className="text-sm text-muted-foreground">
                {sessionTypes.length}{" "}
                {sessionTypes.length === 1 ? "session type" : "session types"}
              </p>
            </div>
            <Button onClick={handleAddNew}>
              <Plus className="h-4 w-4 mr-2" />
              Add Session Type
            </Button>
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
          {!isLoading && sessionTypes.length > 0 && (
            <div className="rounded-md border">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]"></TableHead>
                      <TableHead className="w-[80px]">Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead align="center">Off the Job</TableHead>
                      <TableHead align="center">Active</TableHead>
                      <TableHead align="center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={sessionTypes.map((st) => st.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {sessionTypes.map((sessionType) => (
                        <SortableTableRow
                          key={sessionType.id}
                          sessionType={sessionType}
                          onEdit={handleEdit}
                          onDelete={handleDeleteClick}
                          onToggleActive={handleToggleActive}
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && sessionTypes.length === 0 && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                No session types found. Create one to get started.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <SessionTypeFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        sessionType={editingSessionType}
        onSuccess={() => {
          setIsFormOpen(false);
          setEditingSessionType(null);
          refetch();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this session type? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
