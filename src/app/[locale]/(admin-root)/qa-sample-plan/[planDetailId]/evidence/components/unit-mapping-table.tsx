"use client";

import { Fragment } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UnitMappingResponse } from "@/store/api/qa-sample-plan/types";

interface UnitMappingTableProps {
  unitMappingResponse: UnitMappingResponse | undefined;
  expandedUnits: Set<string | number>;
  onToggleUnitExpansion: (unitCode: string | number) => void;
}

export function UnitMappingTable({
  unitMappingResponse,
  expandedUnits,
  onToggleUnitExpansion,
}: UnitMappingTableProps) {
  if (!unitMappingResponse?.data || unitMappingResponse.data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Unit Mapping</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Unit Title</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unitMappingResponse.data.map((unit) => {
                const hasSubUnits = unit.subUnits && unit.subUnits.length > 0;
                const isExpanded = expandedUnits.has(unit.unit_code);

                return (
                  <Fragment key={unit.unit_code}>
                    <TableRow className="hover:bg-muted/50">
                      <TableCell className="w-[50px]">
                        {hasSubUnits && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onToggleUnitExpansion(unit.unit_code)}
                            className="h-8 w-8"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>{unit.code}</TableCell>
                      <TableCell>{unit.unit_title}</TableCell>
                    </TableRow>
                    {hasSubUnits &&
                      isExpanded &&
                      unit.subUnits?.map((subUnit) => (
                        <TableRow
                          key={subUnit.id}
                          className="bg-muted/30 hover:bg-muted/50"
                        >
                          <TableCell className="w-[50px] pl-8"></TableCell>
                          <TableCell>{subUnit.code || String(subUnit.id)}</TableCell>
                          <TableCell>{subUnit.title || "-"}</TableCell>
                        </TableRow>
                      ))}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
