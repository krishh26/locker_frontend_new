"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { useDebounce } from "@/hooks/use-debounce"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { UserSelectionTable } from "./user-selection-table"
import { useGetLearnersListQuery } from "@/store/api/learner/learnerApi"
import { useGetUsersQuery } from "@/store/api/user/userApi"
import { useCachedCoursesList } from "@/store/hooks/useCachedCoursesList"
import { useGetEmployersQuery } from "@/store/api/employer/employerApi"
import type { Survey, AllocationRole } from "@/store/api/survey/surveyApi"
import { toast } from "sonner"
import { Users } from "lucide-react"

interface AllocateSurveyDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  survey: Survey | null
  onAllocate?: (allocations: Array<{ user_id: number; role: AllocationRole; user_type: "user" | "learner" }>) => Promise<void>
}

const ROLES: AllocationRole[] = ["Trainer", "IQA", "Learner", "EQA"]

const STATUS_OPTIONS = [
  "Awaiting Induction",
  "Certificated",
  "Completed",
  "Early Leaver",
  "Exempt",
  "In Training",
  "IQA Approved",
  "Training Suspended",
  "Transferred",
  "Show only archived users",
]

export function AllocateSurveyDialog({
  open,
  onOpenChange,
  survey,
  onAllocate,
}: AllocateSurveyDialogProps) {
  const t = useTranslations("surveys")
  const [selectedRoles, setSelectedRoles] = useState<Set<AllocationRole>>(new Set())
  const [selectedUsers, setSelectedUsers] = useState<Map<AllocationRole, Set<number>>>(
    new Map()
  )

  // Filter states
  const [learnerFilters, setLearnerFilters] = useState({
    course: "",
    employer: "",
    search: "",
  })
  const [learnerStatusFilters, setLearnerStatusFilters] = useState<Record<string, boolean>>(
    STATUS_OPTIONS.reduce((acc, status) => ({ ...acc, [status]: false }), {})
  )
  const [trainerSearch, setTrainerSearch] = useState("")
  const [iqaSearch, setIqaSearch] = useState("")
  const [eqaSearch, setEqaSearch] = useState("")

  // Debounced search values
  const debouncedLearnerSearch = useDebounce(learnerFilters.search, 500)
  const debouncedTrainerSearch = useDebounce(trainerSearch, 500)
  const debouncedIqaSearch = useDebounce(iqaSearch, 500)
  const debouncedEqaSearch = useDebounce(eqaSearch, 500)

  // Pagination states
  const [learnerPage, setLearnerPage] = useState(1)
  const [trainerPage, setTrainerPage] = useState(1)
  const [iqaPage, setIqaPage] = useState(1)
  const [eqaPage, setEqaPage] = useState(1)
  const pageSize = 10

  // Fetch courses and employers for filters
  const { data: coursesData } = useCachedCoursesList({
    skip: !open
  })
  const { data: employersData } = useGetEmployersQuery({ page: 1, page_size: 100 },{
    skip:!open
  })

  // Get selected statuses for API filter
  const selectedStatuses = useMemo(() => {
    return Object.entries(learnerStatusFilters)
      .filter(([, checked]) => checked)
      .map(([status]) => status)
  }, [learnerStatusFilters])

  // Fetch learners with filters
  const {
    data: learnersData,
    isLoading: isLoadingLearners,
  } = useGetLearnersListQuery(
    {
      page: learnerPage,
      page_size: pageSize,
      keyword: debouncedLearnerSearch,
      course_id: learnerFilters.course ? Number(learnerFilters.course) : undefined,
      employer_id: learnerFilters.employer ? Number(learnerFilters.employer) : undefined,
      status: selectedStatuses.length > 0 ? selectedStatuses[0] : undefined, // API supports single status, use first selected
    },
    {
      skip: !selectedRoles.has("Learner") || !open,
    }
  )

  // Fetch users by role
  const {
    data: trainersData,
    isLoading: isLoadingTrainers,
  } = useGetUsersQuery(
    {
      page: trainerPage,
      page_size: pageSize,
      keyword: debouncedTrainerSearch,
      role: "Trainer",
    },
    {
      skip: !selectedRoles.has("Trainer") || !open,
    }
  )

  const {
    data: iqaData,
    isLoading: isLoadingIqa,
  } = useGetUsersQuery(
    {
      page: iqaPage,
      page_size: pageSize,
      keyword: debouncedIqaSearch,
      role: "IQA",
    },
    {
      skip: !selectedRoles.has("IQA") || !open,
    }
  )

  const {
    data: eqaData,
    isLoading: isLoadingEqa,
  } = useGetUsersQuery(
    {
      page: eqaPage,
      page_size: pageSize,
      keyword: debouncedEqaSearch,
      role: "EQA",
    },
    {
      skip: !selectedRoles.has("EQA") || !open,
    }
  )

  const handleRoleToggle = (role: AllocationRole, checked: boolean) => {
    const newRoles = new Set(selectedRoles)
    if (checked) {
      newRoles.add(role)
    } else {
      newRoles.delete(role)
      // Clear selections for this role
      const newSelectedUsers = new Map(selectedUsers)
      newSelectedUsers.delete(role)
      setSelectedUsers(newSelectedUsers)
      // Reset filters for learners
      if (role === "Learner") {
        setLearnerFilters({ course: "", employer: "", search: "" })
        setLearnerStatusFilters(STATUS_OPTIONS.reduce((acc, status) => ({ ...acc, [status]: false }), {}))
        setLearnerPage(1)
      } else if (role === "Trainer") {
        setTrainerSearch("")
        setTrainerPage(1)
      } else if (role === "IQA") {
        setIqaSearch("")
        setIqaPage(1)
      } else if (role === "EQA") {
        setEqaSearch("")
        setEqaPage(1)
      }
    }
    setSelectedRoles(newRoles)
  }

  const handleUserSelectionChange = (role: AllocationRole, ids: Set<number>) => {
    const newSelectedUsers = new Map(selectedUsers)
    newSelectedUsers.set(role, ids)
    setSelectedUsers(newSelectedUsers)
  }

  const getSelectedCount = (role: AllocationRole): number => {
    return selectedUsers.get(role)?.size || 0
  }

  const totalSelected = useMemo(() => {
    let total = 0
    selectedUsers.forEach((ids) => {
      total += ids.size
    })
    return total
  }, [selectedUsers])

  const getAllocations = (): Array<{
    user_id: number
    role: AllocationRole
    user_type: "user" | "learner"
  }> => {
    const allocations: Array<{
      user_id: number
      role: AllocationRole
      user_type: "user" | "learner"
    }> = []

    selectedUsers.forEach((ids, role) => {
      ids.forEach((userId) => {
        allocations.push({
          user_id: userId,
          role,
          user_type: role === "Learner" ? "learner" : "user",
        })
      })
    })

    return allocations
  }

  const handleAssign = async () => {
    if (totalSelected === 0) {
      toast.error(t("allocate.toastSelectOne"))
      return
    }

    const allocations = getAllocations()

    try {
      if (onAllocate) {
        await onAllocate(allocations)
      } else {
        console.log("Allocating survey:", {
          survey_id: survey?.id,
          allocations,
        })
        toast.success(t("allocate.toastSuccess", { count: totalSelected }))
        handleClose()
      }
    } catch (error) {
      toast.error(t("allocate.toastFailed"))
      console.error("Allocation error:", error)
    }
  }

  const handleClose = () => {
    setSelectedRoles(new Set())
    setSelectedUsers(new Map())
    setLearnerFilters({ course: "", employer: "", search: "" })
    setLearnerStatusFilters(STATUS_OPTIONS.reduce((acc, status) => ({ ...acc, [status]: false }), {}))
    setTrainerSearch("")
    setIqaSearch("")
    setEqaSearch("")
    setLearnerPage(1)
    setTrainerPage(1)
    setIqaPage(1)
    setEqaPage(1)
    onOpenChange(false)
  }

  const courses = coursesData?.data || []
  const employers = employersData?.data || []

  // Filter learners client-side by status if multiple statuses are selected
  const learners = useMemo(() => {
    const fetchedLearners = learnersData?.data || []
    if (selectedStatuses.length > 1) {
      // Multiple statuses selected - filter client-side
      return fetchedLearners.filter((learner) => {
        const learnerStatus = learner.status || ""
        return selectedStatuses.includes(learnerStatus)
      })
    }
    // Single or no status - use API filtered results
    return fetchedLearners
  }, [learnersData?.data, selectedStatuses])

  const trainers = trainersData?.data || []
  const iqas = iqaData?.data || []
  const eqas = eqaData?.data || []

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl! max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("allocate.title")}</DialogTitle>
          <DialogDescription>
            {t("allocate.description", { name: survey?.name ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Role Selection */}
          <div className="space-y-3">
            <Label>{t("allocate.selectRoles")}</Label>
            <div className="flex flex-wrap gap-4">
              {ROLES.map((roleValue) => (
                <div key={roleValue} className="flex items-center space-x-2">
                  <Checkbox
                    id={`role-${roleValue}`}
                    checked={selectedRoles.has(roleValue)}
                    onCheckedChange={(checked) =>
                      handleRoleToggle(roleValue, checked === true)
                    }
                  />
                  <Label
                    htmlFor={`role-${roleValue}`}
                    className="cursor-pointer font-normal"
                  >
                    {t(`allocate.roles.${roleValue}`)}
                  </Label>
                  {getSelectedCount(roleValue) > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {getSelectedCount(roleValue)}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* User Selection Tabs */}
          {selectedRoles.size > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>{t("allocate.selectUsers")}</Label>
                {totalSelected > 0 && (
                  <Badge variant="default" className="ml-2">
                    {t("allocate.usersSelected", { count: totalSelected })}
                  </Badge>
                )}
              </div>

              <Tabs defaultValue={Array.from(selectedRoles)[0]} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  {ROLES.map((roleValue) =>
                    selectedRoles.has(roleValue) ? (
                      <TabsTrigger key={roleValue} value={roleValue}>
                        {t(`allocate.roles.${roleValue}`)}
                        {getSelectedCount(roleValue) > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {getSelectedCount(roleValue)}
                          </Badge>
                        )}
                      </TabsTrigger>
                    ) : null
                  )}
                </TabsList>

                {/* Learners Tab */}
                {selectedRoles.has("Learner") && (
                  <TabsContent value="Learner" className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-wrap gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="learner-course">{t("allocate.course")}</Label>
                        <Select
                          value={learnerFilters.course || "all"}
                          onValueChange={(value) =>
                            setLearnerFilters((prev) => ({ ...prev, course: value === "all" ? "" : value }))
                          }
                        >
                          <SelectTrigger id="learner-course">
                            <SelectValue placeholder={t("allocate.allCourses")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("allocate.allCourses")}</SelectItem>
                            {courses.map((course) => (
                              <SelectItem
                                key={course.course_id}
                                value={String(course.course_id)}
                              >
                                {course.course_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="learner-employer">{t("allocate.employer")}</Label>
                        <Select
                          value={learnerFilters.employer || "all"}
                          onValueChange={(value) =>
                            setLearnerFilters((prev) => ({ ...prev, employer: value === "all" ? "" : value }))
                          }
                        >
                          <SelectTrigger id="learner-employer">
                            <SelectValue placeholder={t("allocate.allEmployers")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("allocate.allEmployers")}</SelectItem>
                            {employers.map((employer) => (
                              <SelectItem
                                key={employer.employer_id}
                                value={String(employer.employer_id)}
                              >
                                {employer.employer_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="learner-search">{t("allocate.search")}</Label>
                        <Input
                          id="learner-search"
                          placeholder={t("allocate.searchPlaceholder")}
                          value={learnerFilters.search}
                          onChange={(e) =>
                            setLearnerFilters((prev) => ({
                              ...prev,
                              search: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    {/* Status Filter Checkboxes */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{t("allocate.statusFilters")}</Label>
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {STATUS_OPTIONS.map((status) => (
                          <div key={status} className="flex items-center space-x-2">
                            <Checkbox
                              id={`learner-status-${status}`}
                              checked={learnerStatusFilters[status] || false}
                              onCheckedChange={(checked) =>
                                setLearnerStatusFilters((prev) => ({
                                  ...prev,
                                  [status]: checked === true,
                                }))
                              }
                            />
                            <Label
                              htmlFor={`learner-status-${status}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {t(`allocate.statusOptions.${status}`)}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Learners Table */}
                    <UserSelectionTable
                      data={learners}
                      selectedIds={selectedUsers.get("Learner") || new Set()}
                      onSelectionChange={(ids) => handleUserSelectionChange("Learner", ids)}
                      isLoading={isLoadingLearners}
                    />

                    {/* Pagination */}
                    {learnersData?.meta_data && learnersData.meta_data.pages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {t("allocate.pageOf", { page: learnerPage, pages: learnersData.meta_data.pages })}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setLearnerPage((p) => Math.max(1, p - 1))}
                            disabled={learnerPage === 1}
                          >
                            {t("allocate.previous")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setLearnerPage((p) =>
                                Math.min(learnersData.meta_data!.pages, p + 1)
                              )
                            }
                            disabled={learnerPage === learnersData.meta_data!.pages}
                          >
                            {t("allocate.next")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* Trainer Tab */}
                {selectedRoles.has("Trainer") && (
                  <TabsContent value="Trainer" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="trainer-search">{t("allocate.search")}</Label>
                      <Input
                        id="trainer-search"
                        placeholder={t("allocate.searchPlaceholder")}
                        value={trainerSearch}
                        onChange={(e) => setTrainerSearch(e.target.value)}
                      />
                    </div>

                    <UserSelectionTable
                      data={trainers}
                      selectedIds={selectedUsers.get("Trainer") || new Set()}
                      onSelectionChange={(ids) => handleUserSelectionChange("Trainer", ids)}
                      isLoading={isLoadingTrainers}
                    />

                    {/* Pagination */}
                    {trainersData?.meta_data && trainersData.meta_data.pages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {t("allocate.pageOf", { page: trainerPage, pages: trainersData.meta_data.pages })}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setTrainerPage((p) => Math.max(1, p - 1))}
                            disabled={trainerPage === 1}
                          >
                            {t("allocate.previous")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setTrainerPage((p) =>
                                Math.min(trainersData.meta_data!.pages, p + 1)
                              )
                            }
                            disabled={trainerPage === trainersData.meta_data!.pages}
                          >
                            {t("allocate.next")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* IQA Tab */}
                {selectedRoles.has("IQA") && (
                  <TabsContent value="IQA" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="iqa-search">{t("allocate.search")}</Label>
                      <Input
                        id="iqa-search"
                        placeholder={t("allocate.searchPlaceholder")}
                        value={iqaSearch}
                        onChange={(e) => setIqaSearch(e.target.value)}
                      />
                    </div>

                    <UserSelectionTable
                      data={iqas}
                      selectedIds={selectedUsers.get("IQA") || new Set()}
                      onSelectionChange={(ids) => handleUserSelectionChange("IQA", ids)}
                      isLoading={isLoadingIqa}
                    />

                    {/* Pagination */}
                    {iqaData?.meta_data && iqaData.meta_data.pages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {t("allocate.pageOf", { page: iqaPage, pages: iqaData.meta_data.pages })}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIqaPage((p) => Math.max(1, p - 1))}
                            disabled={iqaPage === 1}
                          >
                            {t("allocate.previous")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setIqaPage((p) => Math.min(iqaData.meta_data!.pages, p + 1))
                            }
                            disabled={iqaPage === iqaData.meta_data!.pages}
                          >
                            {t("allocate.next")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                )}

                {/* EQA Tab */}
                {selectedRoles.has("EQA") && (
                  <TabsContent value="EQA" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="eqa-search">{t("allocate.search")}</Label>
                      <Input
                        id="eqa-search"
                        placeholder={t("allocate.searchPlaceholder")}
                        value={eqaSearch}
                        onChange={(e) => setEqaSearch(e.target.value)}
                      />
                    </div>

                    <UserSelectionTable
                      data={eqas}
                      selectedIds={selectedUsers.get("EQA") || new Set()}
                      onSelectionChange={(ids) => handleUserSelectionChange("EQA", ids)}
                      isLoading={isLoadingEqa}
                    />

                    {/* Pagination */}
                    {eqaData?.meta_data && eqaData.meta_data.pages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                          {t("allocate.pageOf", { page: eqaPage, pages: eqaData.meta_data.pages })}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEqaPage((p) => Math.max(1, p - 1))}
                            disabled={eqaPage === 1}
                          >
                            {t("allocate.previous")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setEqaPage((p) => Math.min(eqaData.meta_data!.pages, p + 1))
                            }
                            disabled={eqaPage === eqaData.meta_data!.pages}
                          >
                            {t("allocate.next")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                )}
              </Tabs>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t("allocate.cancel")}
          </Button>
          <Button onClick={handleAssign} disabled={totalSelected === 0}>
            <Users className="mr-2 size-4" />
            {t("allocate.assign", { count: totalSelected })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

