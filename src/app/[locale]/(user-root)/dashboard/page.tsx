"use client"

import type { ReactNode } from "react"

import { useAppSelector } from "@/store/hooks"
import { AdminDashboard } from "./components/admin-sections/admin-dashboard"
import { DashboardUserSync } from "./components/dashboard-user-sync"
import { LearnerDashboard } from "./components/learner-section/learner-dashboard"
import { MasterAdminDashboard } from "./components/master-admin-dashboard"
import { AccountManagerDashboard } from "./components/account-manager-dashboard"

export default function DashboardPage() {
  const userRole = useAppSelector((state) => state.auth.user?.role)

  let content: ReactNode
  if (userRole === "MasterAdmin") {
    content = <MasterAdminDashboard />
  } else if (userRole === "AccountManager") {
    content = <AccountManagerDashboard />
  } else if (userRole !== "Learner") {
    content = <AdminDashboard />
  } else {
    content = <LearnerDashboard />
  }

  return (
    <>
      <DashboardUserSync />
      {content}
    </>
  )
}

