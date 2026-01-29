"use client"

import { useAppSelector } from "@/store/hooks"
import { AdminDashboard } from "./components/admin-sections/admin-dashboard"
import { LearnerDashboard } from "./components/learner-section/learner-dashboard"
import { MasterAdminDashboard } from "./components/master-admin-dashboard"
import { AccountManagerDashboard } from "./components/account-manager-dashboard"

export default function DashboardPage() {
  const userRole = useAppSelector((state) => state.auth.user?.role)

  // Render dashboard based on user role
  if (userRole === "MasterAdmin") {
    return <MasterAdminDashboard />
  }

  if (userRole === "AccountManager") {
    return <AccountManagerDashboard />
  }

  if (userRole !== "Learner") {
    return <AdminDashboard />
  }

  // Default to learner dashboard
  return <LearnerDashboard />
}

