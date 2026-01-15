"use client";

import { useState, useMemo, useEffect } from "react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Users } from "lucide-react";
import { LearnerPortfolioCard } from "./learner-portfolio-card";
import { LearnerOverviewFilters } from "./learner-overview-filters";
import { useGetLearnersByUserQuery } from "@/store/api/learner/learnerApi";
import { useAppSelector } from "@/store/hooks";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import type { LearnerListItem } from "@/store/api/learner/types";
import { DataTablePagination } from "@/components/data-table-pagination";
import { useReactTable, getCoreRowModel } from "@tanstack/react-table";

export function LearnerOverviewPageContent() {
  const user = useAppSelector((state) => state.auth.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Fetch learners by user
  const {
    data: learnersData,
    isLoading,
    error,
    refetch,
  } = useGetLearnersByUserQuery(
    {
      user_id: Number(user?.id) || 0,
      role: user?.role || "",
    },
    {
      skip: !user?.id || !user?.role,
    }
  );

  // Filter learners based on debounced search query
  const filteredLearners = useMemo(() => {
    const learners = learnersData?.data || [];
    if (!learners || learners.length === 0) return [];

    if (!debouncedSearchQuery.trim()) return learners;

    const query = debouncedSearchQuery.toLowerCase().trim();

    return learners.filter((learner: LearnerListItem) => {
      const firstName = (learner?.first_name || "").toString().toLowerCase();
      const lastName = (learner?.last_name || "").toString().toLowerCase();
      const fullName = `${firstName} ${lastName}`;
      const learnerId = (learner?.learner_id || "").toString().toLowerCase();
      const email = (learner?.email || "").toString().toLowerCase();
      const comment = (learner?.comment || "").toString().toLowerCase();

      return (
        firstName.includes(query) ||
        lastName.includes(query) ||
        fullName.includes(query) ||
        learnerId.includes(query) ||
        email.includes(query) ||
        comment.includes(query)
      );
    });
  }, [learnersData?.data, debouncedSearchQuery]);

  // Paginate filtered learners
  const paginatedLearners = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredLearners.slice(startIndex, endIndex);
  }, [filteredLearners, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredLearners.length / itemsPerPage);

  // Reset to page 1 when debounced search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  // Create a minimal table object for DataTablePagination
  const table = useReactTable({
    data: [],
    columns: [],
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  // Handle comment update
  const handleCommentUpdate = async () => {
    await refetch();
  };

  if (error) {
    return (
      <div className="container mx-auto p-4 md:p-6">
        <PageHeader
          title="Learner Overview"
          subtitle="Manage and monitor learner progress"
          icon={Users}
        />
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load learners. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title="Learner Overview"
        subtitle="Manage and monitor learner progress"
        icon={Users}
      />

      {/* Filters */}
      <LearnerOverviewFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        isSearching={searchQuery !== debouncedSearchQuery}
      />

      {/* Learners List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : paginatedLearners.length > 0 ? (
        <div className="space-y-4">
          {paginatedLearners.map((learner) => (
            <LearnerPortfolioCard
              key={learner.learner_id}
              learner={learner}
              onCommentUpdate={handleCommentUpdate}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No Matching Learners Found" : "No Learners Found"}
            </h3>
            <p className="text-muted-foreground">
              {searchQuery
                ? "Try adjusting your search criteria"
                : "There are no learners assigned to your account yet"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      <DataTablePagination
        table={table}
        manualPagination={true}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredLearners.length}
        pageSize={itemsPerPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
      />
    </div>
  );
}

