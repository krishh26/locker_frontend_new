"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Accordion } from "@/components/ui/accordion";
import {
  UnitAccordionItem,
  UnitHierarchyHeader,
} from "@/components/unit-hierarchy-accordion";
import type { UnitMappingResponse } from "@/store/api/qa-sample-plan/types";
import { resolveCriterionDisplayCode } from "../../../utils/mapped-topic";

interface UnitMappingTableProps {
  unitMappingResponse: UnitMappingResponse | undefined;
}

type CriteriaRow = {
  id: string | number;
  code: string;
  title: string;
};

export function UnitMappingTable({
  unitMappingResponse,
}: UnitMappingTableProps) {
  const t = useTranslations("qaSamplePlan.evidence.unitMappingTable");
  if (!unitMappingResponse?.data || unitMappingResponse.data.length === 0) {
    return null;
  }

  const criteriaTable = (rows: CriteriaRow[]) => (
    <div className="overflow-x-auto pt-3">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20 sm:w-28">{t("columns.code")}</TableHead>
            <TableHead>{t("columns.unitTitle")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="w-20 align-top font-medium sm:w-28">
                {row.code}
              </TableCell>
              <TableCell className="max-w-xl align-top whitespace-normal">
                <div
                  className="line-clamp-3 wrap-break-word"
                  title={row.title}
                >
                  {row.title || t("na")}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <UnitHierarchyHeader
          unitLabel={t("columns.code")}
          titleLabel={t("columns.unitTitle")}
        />
        <Accordion
          type="multiple"
          defaultValue={[]}
          className="w-full min-w-0 space-y-3"
        >
          {unitMappingResponse.data.map((unit, unitIndex) => {
            const subUnits = unit.subUnits ?? [];
            const unitCode = resolveCriterionDisplayCode({
              code: unit.code,
              title: unit.unit_title,
              fallback: String(unitIndex + 1),
            });

            // Qualification drills down Unit -> Learning Outcome -> criteria;
            // Standard has no topics, so its sub-units are the criteria.
            const hasLearningOutcomes = subUnits.some(
              (subUnit) => (subUnit.topics ?? []).length > 0,
            );

            return (
              <UnitAccordionItem
                key={unit.unit_code}
                value={`unit-${String(unit.unit_code)}`}
                unitLabel={unitCode}
                titleLabel={unit.unit_title}
              >
                {subUnits.length === 0 ? (
                  <p className="pt-3 text-sm text-muted-foreground">
                    {t("na")}
                  </p>
                ) : hasLearningOutcomes ? (
                  <Accordion
                    type="multiple"
                    defaultValue={[]}
                    className="w-full min-w-0 space-y-2 pt-3"
                  >
                    {subUnits.map((subUnit, subUnitIndex) => {
                      const loCode = resolveCriterionDisplayCode({
                        code: subUnit.code,
                        title: subUnit.title,
                        fallback: String(subUnitIndex + 1),
                      });
                      const topics = subUnit.topics ?? [];

                      return (
                        <UnitAccordionItem
                          key={subUnit.id}
                          value={`lo-${String(unit.unit_code)}-${String(subUnit.id)}`}
                          unitLabel={loCode}
                          titleLabel={subUnit.title || t("na")}
                          nested
                        >
                          {topics.length === 0 ? (
                            <p className="pt-3 text-sm text-muted-foreground">
                              {t("na")}
                            </p>
                          ) : (
                            criteriaTable(
                              topics.map((topic, topicIndex) => ({
                                id: topic.id,
                                code: resolveCriterionDisplayCode({
                                  code: topic.code,
                                  title: topic.title,
                                  fallback: `${subUnitIndex + 1}.${topicIndex + 1}`,
                                }),
                                title: topic.title ?? "",
                              })),
                            )
                          )}
                        </UnitAccordionItem>
                      );
                    })}
                  </Accordion>
                ) : (
                  criteriaTable(
                    subUnits.map((subUnit, subUnitIndex) => ({
                      id: subUnit.id,
                      code: resolveCriterionDisplayCode({
                        code: subUnit.code,
                        title: subUnit.title,
                        fallback: String(subUnitIndex + 1),
                      }),
                      title: subUnit.title ?? "",
                    })),
                  )
                )}
              </UnitAccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
