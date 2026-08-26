"use client";

import { Fragment } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { UnitMappingResponse } from "@/store/api/qa-sample-plan/types";
import { resolveCriterionDisplayCode } from "../../../utils/mapped-topic";

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
  const t = useTranslations("qaSamplePlan.evidence.unitMappingTable");
  if (!unitMappingResponse?.data || unitMappingResponse.data.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"></TableHead>
                <TableHead>{t("columns.code")}</TableHead>
                <TableHead>{t("columns.unitTitle")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unitMappingResponse.data.map((unit, unitIndex) => {
                const hasSubUnits = unit.subUnits && unit.subUnits.length > 0;
                const isExpanded = expandedUnits.has(unit.unit_code);

                return (
                  <Fragment key={unit.unit_code}>
                    <TableRow className="hover:bg-muted">
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
                      <TableCell>
                        {resolveCriterionDisplayCode({
                          code: unit.code,
                          title: unit.unit_title,
                          fallback: String(unitIndex + 1),
                        })}
                      </TableCell>
                      <TableCell>{unit.unit_title}</TableCell>
                    </TableRow>
                    {hasSubUnits &&
                      isExpanded &&
                      unit.subUnits?.map((subUnit, subUnitIndex) => {
                        const topics = subUnit.topics ?? [];
                        const loCode = resolveCriterionDisplayCode({
                          code: subUnit.code,
                          title: subUnit.title,
                          fallback: String(subUnitIndex + 1),
                        });

                        if (topics.length === 0) {
                          return (
                            <TableRow
                              key={`${String(unit.unit_code)}-${String(subUnit.id)}`}
                              className="bg-muted hover:bg-muted"
                            >
                              <TableCell className="w-[50px] pl-8"></TableCell>
                              <TableCell>{loCode}</TableCell>
                              <TableCell>{subUnit.title || t("na")}</TableCell>
                            </TableRow>
                          );
                        }

                        return (
                          <Fragment key={`${String(unit.unit_code)}-${String(subUnit.id)}`}>
                            <TableRow className="bg-muted/60 hover:bg-muted/60">
                              <TableCell className="w-[50px] pl-8"></TableCell>
                              <TableCell className="font-medium">{loCode}</TableCell>
                              <TableCell className="font-medium">
                                {subUnit.title || t("na")}
                              </TableCell>
                            </TableRow>
                            {topics.map((topic, topicIndex) => (
                              <TableRow
                                key={`${String(unit.unit_code)}-${String(subUnit.id)}-${String(topic.id)}`}
                                className="bg-muted hover:bg-muted"
                              >
                                <TableCell className="w-[50px] pl-12"></TableCell>
                                <TableCell>
                                  {resolveCriterionDisplayCode({
                                    code: topic.code,
                                    title: topic.title,
                                    fallback: `${subUnitIndex + 1}.${topicIndex + 1}`,
                                  })}
                                </TableCell>
                                <TableCell>{topic.title || t("na")}</TableCell>
                              </TableRow>
                            ))}
                          </Fragment>
                        );
                      })}
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
