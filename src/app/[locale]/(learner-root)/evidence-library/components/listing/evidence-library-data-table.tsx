"use client";

import { useState, useEffect, useCallback, useMemo, useReducer } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Download,
  Plus,
  FileText,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useGetEvidenceListQuery,
  useDeleteEvidenceMutation,
  useReuploadEvidenceMutation,
} from "@/store/api/evidence/evidenceApi";
import { useAppSelector } from "@/store/hooks";
import { selectCourses } from "@/store/slices/authSlice";
import { toast } from "sonner";
import type { EvidenceEntry } from "@/store/api/evidence/types";
import { SearchAndFilter } from "./search-and-filter";
import { ActionMenu } from "./action-menu";
import { DownloadDialog } from "./download-dialog";
import {
  formatDate,
  getStatusColor,
  displayValue,
  truncateText,
} from "../../utils/evidence-helpers";
import { selectCurrentCourseId } from "@/store/slices/courseSlice";

// Selection state reducer
type SelectionState = {
  selectedFiles: Set<number>;
  selectAllFiles: boolean;
};

type SelectionAction =
  | { type: "TOGGLE_FILE"; fileId: number }
  | { type: "SELECT_ALL_FILES"; fileIds: number[] }
  | { type: "DESELECT_ALL_FILES" }
  | { type: "RESET_FILES" };

function selectionReducer(
  state: SelectionState,
  action: SelectionAction
): SelectionState {
  switch (action.type) {
    case "TOGGLE_FILE": {
      const newSelected = new Set(state.selectedFiles);
      if (newSelected.has(action.fileId)) {
        newSelected.delete(action.fileId);
      } else {
        newSelected.add(action.fileId);
      }
      return {
        ...state,
        selectedFiles: newSelected,
        selectAllFiles: false,
      };
    }
    case "SELECT_ALL_FILES": {
      return {
        selectedFiles: new Set<number>(action.fileIds),
        selectAllFiles: true,
      };
    }
    case "DESELECT_ALL_FILES": {
      return {
        selectedFiles: new Set(),
        selectAllFiles: false,
      };
    }
    case "RESET_FILES": {
      return {
        selectedFiles: new Set(),
        selectAllFiles: false,
      };
    }
    default:
      return state;
  }
}

export function EvidenceLibraryDataTable() {
  const router = useRouter();
  const learner = useAppSelector((state) => state.auth.learner);
  const courses = useAppSelector(selectCourses);
  const currentCourseId = useAppSelector(selectCurrentCourseId);
  const userId = learner?.user_id || "";

  // State
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<
    number | "all"
  >(currentCourseId || "all");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [selectedEvidence, setSelectedEvidence] =
    useState<EvidenceEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [selectedCourseForDownload, setSelectedCourseForDownload] =
    useState<number | null>(null);
  const [reuploadDialogOpen, setReuploadDialogOpen] = useState(false);
  const [reuploadEvidence, setReuploadEvidence] = useState<EvidenceEntry | null>(null);
  const [reuploadFile, setReuploadFile] = useState<File | null>(null);

  // Selection state
  const [selectionState, dispatchSelection] = useReducer(selectionReducer, {
    selectedFiles: new Set<number>(),
    selectAllFiles: false,
  });

  // Learner-selected units state: Map<evidenceId, Set<unitId>>
  const [learnerSelectedUnits, setLearnerSelectedUnits] = useState<
    Map<number, Set<string | number>>
  >(new Map());

  // Get user role
  const userRole = learner?.role || "";
  const isLearner = userRole === "Learner";
  const isEmployer = userRole === "Employer";

  // Get selected course details for unit columns
  const selectedCourseDetails = useMemo(() => {
    if (selectedCourseFilter === "all" || !selectedCourseFilter) return null;
    const courseItem = courses.find(
      (c) => (c.course || c).course_id === selectedCourseFilter
    );
    const course = courseItem?.course || courseItem;
    // Check if course has units property (extend type if needed)
    return course && 'units' in course ? course as typeof course & { units?: Array<{ id?: number | string; code?: string; subUnit?: Array<{ id?: number | string; code?: string }> }> } : null;
  }, [selectedCourseFilter, courses]);

  // API Query
  const { data, isLoading, refetch } = useGetEvidenceListQuery(
    {
      user_id: userId as string,
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      meta: true,
      search: globalFilter || undefined,
      course_id:
        selectedCourseFilter === "all" || !selectedCourseFilter
          ? undefined
          : (selectedCourseFilter as number),
    },
    {
      skip: !userId,
      refetchOnMountOrArgChange: true,
    }
  );

  // Get evidence for selected course in download dialog
  const {
    data: selectedCourseEvidenceData,
    isLoading: isLoadingCourseEvidence,
  } = useGetEvidenceListQuery(
    {
      user_id: userId as string,
      page: 1,
      limit: 1000,
      meta: false,
      search: "",
      course_id: selectedCourseForDownload || undefined,
    },
    {
      skip: !selectedCourseForDownload || !downloadDialogOpen,
      refetchOnMountOrArgChange: true,
    }
  );

  const [deleteEvidence, { isLoading: isDeleteLoading }] =
    useDeleteEvidenceMutation();
  const [reuploadEvidenceMutation, { isLoading: isReuploadLoading }] =
    useReuploadEvidenceMutation();

  // Handle errors is handled by RTK Query error handling

  // Get files from selected course for download dialog
  const getFilesFromSelectedCourse = useMemo(() => {
    if (selectedCourseForDownload && selectedCourseEvidenceData?.data) {
      return selectedCourseEvidenceData.data;
    }
    return [];
  }, [selectedCourseForDownload, selectedCourseEvidenceData]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!selectedEvidence) return;

    try {
      await deleteEvidence(selectedEvidence.assignment_id).unwrap();
      toast.success("Evidence deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedEvidence(null);
      refetch();
    } catch {
      toast.error("Failed to delete evidence. Please try again.");
    }
  }, [selectedEvidence, deleteEvidence, refetch]);

  // Handle download
  const handleDownload = useCallback((evidence: EvidenceEntry) => {
    if (!evidence.file?.url) {
      toast.warning("No file available for download");
      return;
    }

    const fileName = evidence.file.name || `evidence_${evidence.assignment_id}.pdf`;
    const link = document.createElement("a");
    link.href = evidence.file.url;
    link.download = fileName;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Downloading ${fileName}`);
  }, []);

  // Handle view/edit
  const handleView = useCallback((evidence: EvidenceEntry) => {
    // Navigate to evidence detail/edit page
    router.push(`/evidence-library/create?id=${evidence.assignment_id}`);
  }, [router]);

  // Handle reupload
  const handleReuploadClick = useCallback((evidence: EvidenceEntry) => {
    setReuploadEvidence(evidence);
    setReuploadFile(null);
    setReuploadDialogOpen(true);
  }, []);

  const handleReuploadSubmit = useCallback(async () => {
    if (!reuploadEvidence || !reuploadFile) {
      toast.error("Please select a file to upload");
      return;
    }

    try {
      await reuploadEvidenceMutation({
        id: reuploadEvidence.assignment_id,
        data: { file: reuploadFile },
      }).unwrap();
      toast.success("Evidence file replaced successfully");
      setReuploadDialogOpen(false);
      setReuploadEvidence(null);
      setReuploadFile(null);
      refetch();
    } catch (error) {
      const err = error as { data?: { error?: string; message?: string } };
      toast.error(err?.data?.error || err?.data?.message || "Failed to reupload evidence");
    }
  }, [reuploadEvidence, reuploadFile, reuploadEvidenceMutation, refetch]);


  // Handle download all
  const handleDownloadAll = useCallback(() => {
    setDownloadDialogOpen(true);
    setSelectedCourseForDownload(null);
    dispatchSelection({ type: "RESET_FILES" });
  }, []);

  // Handle file selection in download dialog
  const handleFileSelection = useCallback((fileId: number) => {
    dispatchSelection({ type: "TOGGLE_FILE", fileId });
  }, []);

  // Handle select all files in download dialog
  const handleSelectAllFiles = useCallback(() => {
    if (selectionState.selectAllFiles) {
      dispatchSelection({ type: "DESELECT_ALL_FILES" });
    } else {
      const allFileIds = getFilesFromSelectedCourse.map(
        (file) => file.assignment_id
      );
      dispatchSelection({ type: "SELECT_ALL_FILES", fileIds: allFileIds });
    }
  }, [selectionState.selectAllFiles, getFilesFromSelectedCourse]);


  // Table data
  const tableData = useMemo(() => {
    return data?.data || [];
  }, [data]);

  // Build dynamic columns based on selected course
  const columns: ColumnDef<EvidenceEntry>[] = useMemo(() => {
    const baseColumns: ColumnDef<EvidenceEntry>[] = [
      {
        accessorKey: "title",
        header: "Title",
        cell: ({ row }) => {
          const title = row.original.title;
          return (
            <div className="max-w-[200px]">
              <p className="font-medium">{truncateText(title, 40)}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        cell: ({ row }) => {
          const description = row.original.description;
          return (
            <div className="max-w-[200px]">
              <p className="text-sm text-muted-foreground">
                {truncateText(description, 30)}
              </p>
            </div>
          );
        },
      },
      {
        accessorKey: "file",
        header: "Files",
        cell: ({ row }) => {
          const file = row.original.file;
          if (!file) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <a
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
            </a>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          const color = getStatusColor(status);
          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                color === "success"
                  ? "bg-green-100 text-green-800"
                  : color === "warning"
                  ? "bg-yellow-100 text-yellow-800"
                  : color === "info"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {displayValue(status)}
            </span>
          );
        },
      },
      {
        accessorKey: "created_at",
        header: "Created Date",
        cell: ({ row }) => {
          return (
            <span className="text-sm">{formatDate(row.original.created_at)}</span>
          );
        },
      },
      {
        id: "view_details",
        header: "View",
        cell: ({ row }) => {
          const evidenceId = row.original.assignment_id;
          const selectedUnits = learnerSelectedUnits.get(evidenceId);
          
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // Pass selected units via URL search params
                const params = new URLSearchParams();
                if (selectedUnits && selectedUnits.size > 0) {
                  params.set("selectedUnits", Array.from(selectedUnits).join(","));
                }
                const queryString = params.toString();
                router.push(
                  `/evidence-library/${evidenceId}/view${queryString ? `?${queryString}` : ""}`
                );
              }}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          );
        },
      },
    ];

    // If "All" is selected, show course columns
    if (selectedCourseFilter === "all" || !selectedCourseFilter) {
      const courseList = courses
        .map((courseItem) => {
          const course = courseItem.course || courseItem;
          if (
            course?.course_id &&
            course.course_core_type !== "Gateway" &&
            typeof course.course_id === "number"
          ) {
            return {
              course_id: course.course_id,
              course_name: course.course_name,
              course_code: course.course_code,
            };
          }
          return null;
        })
        .filter((course): course is NonNullable<typeof course> => course !== null)
        .sort((a, b) => a.course_name.localeCompare(b.course_name));

      courseList.forEach((course) => {
        baseColumns.push({
          id: `course_${course.course_id}`,
          header: () => (
            <div className="text-center font-semibold text-sm">
              {course.course_name}
            </div>
          ),
              cell: ({ row }) => {
                const belongsToCourse =
                  row.original.mappings &&
                  Array.isArray(row.original.mappings) &&
                  row.original.mappings.some(
                    (mapping) => mapping.course?.course_id === course.course_id
                  );

                return (
                  <div className="flex justify-center">
                    <Checkbox checked={belongsToCourse} disabled />
                  </div>
                );
              },
        });
      });
    } else if (selectedCourseDetails?.units && Array.isArray(selectedCourseDetails.units)) {
      // Check if this is a Qualification course
      const courseDetails = selectedCourseDetails as typeof selectedCourseDetails & { course_core_type?: string };
      const isQualificationCourse = courseDetails.course_core_type === "Qualification";
      
      if (isQualificationCourse) {
        // For Qualification courses: show unit code in header and check mappings by topic ID
        selectedCourseDetails.units.forEach((unit: { 
          id?: number | string; 
          code?: string;
          title?: string;
          subUnit?: Array<{ 
            id?: number | string; 
            code?: string;
            topics?: Array<{ id?: number | string; code?: string }>;
          }> 
        }) => {
          const unitId = unit.id;
          const unitCode = unit.code || String(unitId);
          const unitTitle = unit.title || unitCode;

          baseColumns.push({
            id: `unit_${unitId}`,
            header: () => (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-center font-semibold text-sm cursor-help">
                    {unitCode}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{unitTitle}</p>
                </TooltipContent>
              </Tooltip>
            ),
            cell: ({ row }) => {
              // For Qualification courses, check if any topic in this unit's subUnits has a mapping
              // mapping.unit_code contains the topic ID (as string or number)
              const evidence = row.original;
              let mappingStatus = {
                learnerMap: false,
                trainerMap: false,
                signedOff: false,
              };

              if (evidence.mappings && Array.isArray(evidence.mappings) && unit.subUnit) {
                // Check all subUnits and their topics
                for (const subUnit of unit.subUnit) {
                  if (subUnit.topics && Array.isArray(subUnit.topics)) {
                    for (const topic of subUnit.topics) {
                      // Find mapping where unit_code matches topic.id (handle type conversion)
                      const matchingMapping = evidence.mappings.find((mapping) => {
                        // Convert both to string for comparison (topic.id is string, mapping.unit_code might be string or number)
                        return String(mapping.unit_code) === String(topic.id);
                      });

                      if (matchingMapping) {
                        // If any topic in this unit has a mapping, mark the unit as mapped
                        // Handle optional boolean properties and support both camelCase and snake_case
                        const learnerMap = matchingMapping.learnerMap ?? (matchingMapping as { learner_map?: boolean }).learner_map ?? false;
                        const trainerMap = matchingMapping.trainerMap ?? (matchingMapping as { trainer_map?: boolean }).trainer_map ?? false;
                        const signedOff = matchingMapping.signedOff ?? (matchingMapping as { signed_off?: boolean }).signed_off ?? false;
                        
                        mappingStatus = {
                          learnerMap: learnerMap === true || mappingStatus.learnerMap,
                          trainerMap: trainerMap === true || mappingStatus.trainerMap,
                          signedOff: signedOff === true || mappingStatus.signedOff,
                        };
                        // Break inner loop since we found a mapping for this unit
                        break;
                      }
                    }
                    // If we found a mapping, break outer loop
                    if (mappingStatus.learnerMap || mappingStatus.trainerMap || mappingStatus.signedOff) {
                      break;
                    }
                  }
                }
              }

              const evidenceId = row.original.assignment_id;
              const selectedUnits = learnerSelectedUnits.get(evidenceId) || new Set<string | number>();
              // Check if this unit is selected by learner (for qualification, check if any topic is selected)
              let isLearnerSelected = false;
              if (unit.subUnit) {
                for (const subUnit of unit.subUnit) {
                  if (subUnit.topics && Array.isArray(subUnit.topics)) {
                    for (const topic of subUnit.topics) {
                      if (topic.id && selectedUnits.has(topic.id)) {
                        isLearnerSelected = true;
                        break;
                      }
                    }
                    if (isLearnerSelected) break;
                  }
                }
              }

              const isMapped =
                mappingStatus.learnerMap ||
                mappingStatus.trainerMap ||
                mappingStatus.signedOff ||
                isLearnerSelected;

              let checkboxColor = "text-muted-foreground";
              if (mappingStatus.signedOff) {
                checkboxColor = "text-green-600";
              } else if (mappingStatus.trainerMap) {
                checkboxColor = "text-orange-600";
              } else if (mappingStatus.learnerMap || isLearnerSelected) {
                checkboxColor = "text-foreground";
              }

              const handleUnitToggle = (checked: boolean) => {
                setLearnerSelectedUnits((prev) => {
                  const newMap = new Map(prev);
                  const evidenceUnits = new Set(newMap.get(evidenceId) || []);
                  
                  if (checked) {
                    // Select all topics in this unit
                    if (unit.subUnit) {
                      unit.subUnit.forEach((subUnit) => {
                        if (subUnit.topics && Array.isArray(subUnit.topics)) {
                          subUnit.topics.forEach((topic) => {
                            if (topic.id) {
                              evidenceUnits.add(topic.id);
                            }
                          });
                        }
                      });
                    }
                  } else {
                    // Deselect all topics in this unit
                    if (unit.subUnit) {
                      unit.subUnit.forEach((subUnit) => {
                        if (subUnit.topics && Array.isArray(subUnit.topics)) {
                          subUnit.topics.forEach((topic) => {
                            if (topic.id) {
                              evidenceUnits.delete(topic.id);
                            }
                          });
                        }
                      });
                    }
                  }
                  
                  if (evidenceUnits.size > 0) {
                    newMap.set(evidenceId, evidenceUnits);
                  } else {
                    newMap.delete(evidenceId);
                  }
                  
                  return newMap;
                });
              };

              return (
                <div className="flex justify-center">
                  <Checkbox
                    checked={isMapped}
                    disabled={!isLearner || (selectedCourseFilter as string | number) === "all"}
                    onCheckedChange={handleUnitToggle}
                    className={checkboxColor}
                  />
                </div>
              );
            },
          });
        });
      } else {
        // For Standard courses: Show Knowledge, Behaviour, and Skills columns
        const UNIT_TYPES = {
          KNOWLEDGE: "Knowledge",
          BEHAVIOUR: "Behaviour",
          SKILLS: "Skills",
        } as const;

        const COMBINED_UNIT_TYPES = [
          UNIT_TYPES.KNOWLEDGE,
          UNIT_TYPES.BEHAVIOUR,
          UNIT_TYPES.SKILLS,
        ] as const;

        // Get all units grouped by type
        const unitsByType = new Map<string, Array<{ id?: number | string; code?: string; type?: string }>>();
        selectedCourseDetails.units.forEach((unit: { id?: number | string; code?: string; type?: string; subUnit?: Array<{ id?: number | string; code?: string }> }) => {
          if (unit.type && (COMBINED_UNIT_TYPES as readonly string[]).includes(unit.type)) {
          if (!unitsByType.has(unit.type)) {
            unitsByType.set(unit.type, []);
          }
          unitsByType.get(unit.type)!.push(unit as { id?: number | string; code?: string; type?: string });
          }
        });

        // Create columns for Knowledge, Behaviour, and Skills
        COMBINED_UNIT_TYPES.forEach((unitType) => {
          const unitsOfType = unitsByType.get(unitType) || [];
          if (unitsOfType.length > 0) {
            baseColumns.push({
              id: `type_${unitType}`,
              header: () => (
                <div className="text-center font-semibold text-sm">
                  {unitType}
                </div>
              ),
              cell: ({ row }) => {
                const evidence = row.original;
                
                // Check if any mapping's unit_code matches a unit with this type
                let mappingStatus = {
                  learnerMap: false,
                  trainerMap: false,
                  signedOff: false,
                };

                if (evidence.mappings && Array.isArray(evidence.mappings)) {
                  // Get all unit IDs of this type
                  const unitIdsOfType = unitsOfType.map((u) => String(u.id));

                  // Find any mapping where unit_code matches a unit of this type
                  const matchingMapping = evidence.mappings.find((mapping) => {
                    // Check if mapping belongs to this course
                    const belongsToCourse = mapping.course?.course_id === selectedCourseDetails.course_id;
                    if (!belongsToCourse) return false;

                    // For Standard courses: unit_code is the unit ID
                    // Check if it matches any unit ID of this type
                    return mapping.sub_unit_id === null && unitIdsOfType.includes(String(mapping.unit_code));
                  });

                  if (matchingMapping) {
                    // Handle optional boolean properties and support both camelCase and snake_case
                    const learnerMap = matchingMapping.learnerMap ?? (matchingMapping as { learner_map?: boolean }).learner_map ?? false;
                    const trainerMap = matchingMapping.trainerMap ?? (matchingMapping as { trainer_map?: boolean }).trainer_map ?? false;
                    const signedOff = matchingMapping.signedOff ?? (matchingMapping as { signed_off?: boolean }).signed_off ?? false;

                    mappingStatus = {
                      learnerMap: learnerMap === true,
                      trainerMap: trainerMap === true,
                      signedOff: signedOff === true,
                    };
                  }
                }

                const evidenceId = row.original.assignment_id;
                const selectedUnits = learnerSelectedUnits.get(evidenceId) || new Set<string | number>();
                // Check if any unit of this type is selected by learner
                const isLearnerSelected = unitsOfType.some((u) => {
                  const unitWithSubUnit = u as typeof u & { subUnit?: Array<{ id?: string | number }> };
                  if (unitWithSubUnit.subUnit && Array.isArray(unitWithSubUnit.subUnit) && unitWithSubUnit.subUnit.length > 0) {
                    return unitWithSubUnit.subUnit.some((sub) => sub.id && selectedUnits.has(sub.id));
                  } else {
                    return u.id && selectedUnits.has(u.id);
                  }
                });

                const isMapped =
                  mappingStatus.learnerMap ||
                  mappingStatus.trainerMap ||
                  mappingStatus.signedOff ||
                  isLearnerSelected;

                let checkboxColor = "text-muted-foreground";
                if (mappingStatus.signedOff) {
                  checkboxColor = "text-green-600";
                } else if (mappingStatus.trainerMap) {
                  checkboxColor = "text-orange-600";
                } else if (mappingStatus.learnerMap || isLearnerSelected) {
                  checkboxColor = "text-foreground";
                }

                const handleTypeToggle = (checked: boolean) => {
                  setLearnerSelectedUnits((prev) => {
                    const newMap = new Map(prev);
                    const evidenceUnits = new Set(newMap.get(evidenceId) || []);
                    
                    if (checked) {
                      // Select all units/subUnits of this type
                      unitsOfType.forEach((u) => {
                        const unitWithSubUnit = u as typeof u & { subUnit?: Array<{ id?: string | number }> };
                        if (unitWithSubUnit.subUnit && Array.isArray(unitWithSubUnit.subUnit) && unitWithSubUnit.subUnit.length > 0) {
                          unitWithSubUnit.subUnit.forEach((sub) => {
                            if (sub.id) {
                              evidenceUnits.add(sub.id);
                            }
                          });
                        } else if (u.id) {
                          evidenceUnits.add(u.id);
                        }
                      });
                    } else {
                      // Deselect all units/subUnits of this type
                      unitsOfType.forEach((u) => {
                        const unitWithSubUnit = u as typeof u & { subUnit?: Array<{ id?: string | number }> };
                        if (unitWithSubUnit.subUnit && Array.isArray(unitWithSubUnit.subUnit) && unitWithSubUnit.subUnit.length > 0) {
                          unitWithSubUnit.subUnit.forEach((sub) => {
                            if (sub.id) {
                              evidenceUnits.delete(sub.id);
                            }
                          });
                        } else if (u.id) {
                          evidenceUnits.delete(u.id);
                        }
                      });
                    }
                    
                    if (evidenceUnits.size > 0) {
                      newMap.set(evidenceId, evidenceUnits);
                    } else {
                      newMap.delete(evidenceId);
                    }
                    
                    return newMap;
                  });
                };

                return (
                  <div className="flex justify-center">
                    <Checkbox
                      checked={isMapped}
                      disabled={!isLearner || (selectedCourseFilter as string | number) === "all" || !selectedCourseFilter}
                      onCheckedChange={handleTypeToggle}
                      className={checkboxColor}
                    />
                  </div>
                );
              },
            });
          }
        });
      }
    }

    // Add actions column
    baseColumns.push({
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const evidence = row.original;
        return (
          <ActionMenu
            evidence={evidence}
            onReupload={handleReuploadClick}
            onDownload={() => handleDownload(evidence)}
            onDelete={() => {
              setSelectedEvidence(evidence);
              setDeleteDialogOpen(true);
            }}
          />
        );
      },
    });

    return baseColumns;
  }, [selectedCourseFilter, selectedCourseDetails, learnerSelectedUnits, router, courses, isLearner, handleReuploadClick, handleDownload]);

  const table = useReactTable({
    data: tableData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    pageCount: data?.meta_data?.pages || 0,
    onPaginationChange: setPagination,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination,
    },
  });

  // Reset to first page when filter changes
  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [globalFilter, selectedCourseFilter, currentCourseId]);

  // Sync select all files state
  useEffect(() => {
    if (getFilesFromSelectedCourse.length > 0) {
      const fileIds = getFilesFromSelectedCourse.map(
        (file) => file.assignment_id
      );
      const allSelected =
        fileIds.length > 0 &&
        fileIds.every((id) => selectionState.selectedFiles.has(id));

      if (allSelected !== selectionState.selectAllFiles) {
        if (allSelected) {
          dispatchSelection({
            type: "SELECT_ALL_FILES",
            fileIds,
          });
        } else {
          dispatchSelection({ type: "DESELECT_ALL_FILES" });
        }
      }
    } else {
      if (selectionState.selectAllFiles) {
        dispatchSelection({ type: "DESELECT_ALL_FILES" });
      }
    }
  }, [
    selectionState.selectedFiles,
    selectionState.selectAllFiles,
    getFilesFromSelectedCourse,
  ]);

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading evidence library...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchAndFilter
          searchQuery={globalFilter}
          onSearchChange={setGlobalFilter}
          onClearSearch={() => setGlobalFilter("")}
          selectedCourseFilter={selectedCourseFilter}
          onCourseFilterChange={setSelectedCourseFilter}
          courses={courses}
        />
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={handleDownloadAll}
            disabled={!tableData || tableData.length === 0}
            className="cursor-pointer"
          >
            <Download className="mr-2 size-4" />
            Download Evidence Files
          </Button>
          {!isEmployer && (
            <Button
              onClick={() => router.push("/evidence-library/new")}
              className="cursor-pointer"
            >
              <Plus className="mr-2 size-4" />
              Add Evidence
            </Button>
          )}
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No evidence found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{" "}
          {data?.meta_data?.items || 0} entries
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:space-x-6 lg:space-x-8">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium">Page</p>
            <strong className="text-sm">
              {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount() || 1}
            </strong>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: prev.pageIndex - 1,
                }));
              }}
              disabled={!table.getCanPreviousPage()}
              className="cursor-pointer"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setPagination((prev) => ({
                  ...prev,
                  pageIndex: prev.pageIndex + 1,
                }));
              }}
              disabled={!table.getCanNextPage()}
              className="cursor-pointer"
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {!isEmployer && (
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Evidence?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this evidence will also remove all associated data and
              relationships. This action cannot be undone. Proceed with deletion?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleteLoading ? "Deleting..." : "Delete Evidence"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      )}

      {/* Download Dialog */}
      <DownloadDialog
        open={downloadDialogOpen}
        onClose={() => {
          setDownloadDialogOpen(false);
          setSelectedCourseForDownload(null);
          dispatchSelection({ type: "RESET_FILES" });
        }}
        courses={courses}
        selectedCourseForDownload={selectedCourseForDownload}
        onCourseSelect={(courseId) => {
          setSelectedCourseForDownload(courseId);
          dispatchSelection({ type: "RESET_FILES" });
        }}
        evidenceFiles={getFilesFromSelectedCourse}
        isLoadingEvidence={isLoadingCourseEvidence}
        selectedFiles={selectionState.selectedFiles}
        onFileSelection={handleFileSelection}
        onSelectAllFiles={handleSelectAllFiles}
        isDownloading={false}
        selectedCourseName={
          selectedCourseForDownload
            ? courses
                .map((courseItem) => {
                  const course = courseItem.course || courseItem;
                  return course;
                })
                .find((c) => c?.course_id === selectedCourseForDownload)
                ?.course_name || undefined
            : undefined
        }
      />

      {/* Reupload Dialog */}
      <AlertDialog open={reuploadDialogOpen} onOpenChange={setReuploadDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reupload Evidence</AlertDialogTitle>
            <AlertDialogDescription>
              Select a new file to replace the existing evidence file for &quot;{reuploadEvidence?.title}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <input
              type="file"
              onChange={(e) => setReuploadFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
            />
            {reuploadFile && (
              <p className="mt-2 text-sm text-muted-foreground">
                Selected: {reuploadFile.name}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setReuploadDialogOpen(false);
                setReuploadEvidence(null);
                setReuploadFile(null);
              }}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReuploadSubmit}
              disabled={!reuploadFile || isReuploadLoading}
            >
              {isReuploadLoading ? "Uploading..." : "Upload"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
