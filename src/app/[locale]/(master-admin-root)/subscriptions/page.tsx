"use client"

import { PageHeader } from "@/components/dashboard/page-header"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CreditCard, Layers } from "lucide-react"
import { SubscriptionsDataTable } from "./components/subscriptions-data-table"
import { PlansDataTable } from "./components/plans-data-table"
import { useTranslations } from "next-intl"

export default function SubscriptionsPage() {
  const t = useTranslations("subscriptions")

  return (
    <div className="space-y-6 px-4 lg:px-6 pb-8">
      <PageHeader
        title={t("page.title")}
        subtitle={t("page.subtitle")}
      />
      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList>
          <TabsTrigger value="subscriptions" className="gap-2">
            <CreditCard className="h-4 w-4" />
            {t("tabs.subscriptions")}
          </TabsTrigger>
          <TabsTrigger value="plans" className="gap-2">
            <Layers className="h-4 w-4" />
            {t("tabs.plans")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="subscriptions" className="mt-4">
          <SubscriptionsDataTable />
        </TabsContent>
        <TabsContent value="plans" className="mt-4">
          <PlansDataTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
