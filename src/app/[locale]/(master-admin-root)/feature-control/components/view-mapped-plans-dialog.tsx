"use client"

import { Link2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useGetFeaturePlansQuery } from "@/store/api/feature-control/featureControlApi"
import type { Feature } from "@/store/api/feature-control/types"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface ViewMappedPlansDialogProps {
  feature: Feature
  onClose?: () => void
  onMapToPlan?: () => void
}

export function ViewMappedPlansDialog({
  feature,
  onClose,
  onMapToPlan,
}: ViewMappedPlansDialogProps) {
  const { data, isLoading, error } = useGetFeaturePlansQuery(feature.id)

  const plans = data?.data ?? []

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-muted rounded-md">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-3 bg-muted rounded-md">
          <div className="font-medium">{feature.name}</div>
          <div className="text-sm text-muted-foreground">{feature.code}</div>
        </div>
        <p className="text-sm text-destructive">
          Failed to load mapped plans. Please try again.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="p-3 bg-muted rounded-md">
          <div className="font-medium">{feature.name}</div>
          <div className="text-sm text-muted-foreground">{feature.code}</div>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No plans mapped. Use Map to Plan to add one.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plan</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="text-right">Limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((item) => (
                <TableRow key={item.planId}>
                  <TableCell className="font-medium">{item.planName}</TableCell>
                  <TableCell>
                    <Badge variant={item.enabled ? "default" : "secondary"}>
                      {item.enabled ? "Yes" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.limitValue != null ? item.limitValue : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4 border-t">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        )}
        {onMapToPlan && (
          <Button
            type="button"
            variant="default"
            onClick={onMapToPlan}
            className="w-full sm:w-auto"
          >
            <Link2 className="mr-2 h-4 w-4" />
            Map to Plan
          </Button>
        )}
      </div>
    </div>
  )
}
