'use client'

import {
  Lock,
  Users,
  Shield,
  MessageSquare,
  Clock,
  Download,
  FileSignature,
  Ban,
} from 'lucide-react'
import {
  LayoutDashboard,
  MessageCircle,
  GraduationCap,
  FileBarChart,
  FileText,
  Lightbulb,
  HelpCircle,
  ClipboardList,
  Calendar,
  Settings,
  BookOpen,
  PoundSterling,
  TrendingUp,
  Heart,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { useAppSelector } from '@/store/hooks'
import { getAllowedRolesForPath } from '@/config/route-access'
import { isRoleAllowed } from '@/config/auth-roles'

type SidebarItem = {
  title: string
  url: string
  icon?: LucideIcon
  items?: SidebarItem[]
}

type SidebarGroup = {
  label: string
  items: SidebarItem[]
}

const data: {
  learner: null
  navGroups: SidebarGroup[]
} = {
  learner: null,
  navGroups: [
    {
      label: 'Dashboards',
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          icon: LayoutDashboard,
        },
        // {
        //   title: "Dashboard 2",
        //   url: "/dashboard-2",
        //   icon: LayoutPanelLeft,
        // },
      ],
    },
    {
      label: 'Learner',
      items: [
        // {
        //   title: "Mail",
        //   url: "/dashboard/mail",
        //   icon: Mail,
        // },
        // {
        //   title: "Tasks",
        //   url: "/dashboard/tasks",
        //   icon: CheckSquare,
        // },
        // {
        //   title: "Chat",
        //   url: "/dashboard/chat",
        //   icon: MessageCircle,
        // },
        // {
        //   title: "Calendar",
        //   url: "/dashboard/calendar",
        //   icon: Calendar,
        // },
        // {
        //   title: "Users",
        //   url: "/dashboard/users",
        //   icon: Users,
        // },
        {
          title: 'CPD',
          url: '/cpd',
          icon: GraduationCap,
        },
        {
          title: 'Forum',
          url: '/forum',
          icon: MessageCircle,
        },
        {
          title: 'Skills Scan',
          url: '/skills-scan',
          icon: FileBarChart,
        },
        {
          title: 'Forms',
          url: '/learner-forms',
          icon: FileText,
        },
        {
          title: 'Propose Your Innovations',
          url: '/propose-your-innovations',
          icon: Lightbulb,
        },
        {
          title: 'Support',
          url: '/support',
          icon: HelpCircle,
        },
        // {
        //   title: "Evidence Library",
        //   url: "/dashboard/evidence-library",
        //   icon: FolderOpen,
        // },
        // {
        //   title: "Module Unit Progress",
        //   url: "/dashboard/module-unit-progress",
        //   icon: BookOpen,
        // },
        // {
        //   title: "Learning Plan",
        //   url: "/dashboard/learning-plan",
        //   icon: Calendar,
        // },
        // {
        //   title: "Course Resources",
        //   url: "/dashboard/course-resources",
        //   icon: BookOpen,
        // },
        // {
        //   title: "Learners Documents to Sign",
        //   url: "/dashboard/learners-documents-to-sign",
        //   icon: FileSignature,
        // },
        // {
        //   title: "Resources",
        //   url: "/dashboard/resources",
        //   icon: BookOpen,
        // },
        // {
        //   title: "Health and Wellbeing",
        //   url: "/dashboard/health-wellbeing",
        //   icon: Heart,
        // },
        // {
        //   title: "Time Log",
        //   url: "/dashboard/time-log",
        //   icon: Clock,
        // },
        // {
        //   title: 'Surveys',
        //   url: '/surveys',
        //   icon: ClipboardList,
        // },
      ],
    },
    {
      label: 'Admin',
      items: [
        {
          title: 'Admin Modules',
          url: '/admin',
          icon: Settings,
        },
        // {
        //   title: "Pricing",
        //   url: "/pricing",
        //   icon: CreditCard,
        // },
        {
          title: 'Forum',
          url: '/forum',
          icon: MessageCircle,
        },
        {
          title: 'Calendar',
          url: '/calendar-admin',
          icon: Calendar,
        },
        {
          title: 'Course Builder',
          url: '/course-builder',
          icon: BookOpen,
        },
        {
          title: 'Surveys',
          url: '/surveys',
          icon: ClipboardList,
        },
        {
          title: 'Funding Bands',
          url: '/funding-bands',
          icon: PoundSterling,
        },
        {
          title: 'Forms',
          url: '/forms',
          icon: FileText,
        },
        {
          title: 'Trainer Risk Rating',
          url: '/trainer-risk-rating',
          icon: TrendingUp,
        },
        {
          title: 'Wellbeing Resources',
          url: '/wellbeing',
          icon: Heart,
        },
        {
          title: 'QA Sample Plan',
          url: '/qa-sample-plan',
          icon: ClipboardList,
        },
        {
          title: 'Caseload Management',
          url: '/caseload',
          icon: Users,
        },
        {
          title: 'Safeguarding',
          url: '/safeguarding',
          icon: Shield,
        },
        {
          title: 'Acknowledge Message',
          url: '/acknowledge-message',
          icon: MessageSquare,
        },
        {
          title: 'Default Review Weeks',
          url: '/default-review-weeks',
          icon: Calendar,
        },
        {
          title: 'IQA Maintain Questions',
          url: '/iqa-questions',
          icon: HelpCircle,
        },
        {
          title: 'Session Types',
          url: '/session-types',
          icon: Clock,
        },
        {
          title: 'Timelog Data Export',
          url: '/timelog-export',
          icon: Download,
        },
        {
          title: 'Awaiting Signature',
          url: '/awaiting-signature',
          icon: FileSignature,
        },
        {
          title: 'Gateway Report',
          url: '/gateway-report',
          icon: FileBarChart,
        },
        {
          title: 'Exclude From Overall Progress',
          url: '/progress-exclusion',
          icon: Ban,
        },
        {
          title: 'Learner Mangement',
          url: '/learners',
          icon: Users,
        },
        {
          title: 'Propose Your Innovations',
          url: '/propose-your-innovations',
          icon: Lightbulb,
        },
        {
          title: 'Support',
          url: '/support',
          icon: HelpCircle,
        },
      ],
    },
    {
      label: 'Trainer',
      items: [
        {
          title: 'Learner Overview',
          url: '/learner-overview',
          icon: Users,
        },
        {
          title: 'Learner Management',
          url: '/learners',
          icon: GraduationCap,
        },
        {
          title: 'Resources',
          url: '/resources',
          icon: BookOpen,
        },
      ],
    },
    // {
    //   label: "Pages",
    //   items: [
    //     {
    //       title: "Settings",
    //       url: "#",
    //       icon: Settings,
    //       items: [
    //         {
    //           title: "User Settings",
    //           url: "/dashboard/settings/user",
    //         },
    //         {
    //           title: "Account Settings",
    //           url: "/dashboard/settings/account",
    //         },
    //         {
    //           title: "Plans & Billing",
    //           url: "/dashboard/settings/billing",
    //         },
    //         {
    //           title: "Appearance",
    //           url: "/dashboard/settings/appearance",
    //         },
    //         {
    //           title: "Notifications",
    //           url: "/dashboard/settings/notifications",
    //         },
    //         {
    //           title: "Connections",
    //           url: "/dashboard/settings/connections",
    //         },
    //       ],
    //     },
    //     {
    //       title: "FAQs",
    //       url: "/dashboard/faqs",
    //       icon: HelpCircle,
    //     },
    //     {
    //       title: "Pricing",
    //       url: "/dashboard/pricing",
    //       icon: CreditCard,
    //     },
    //   ],
    // },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useAppSelector((state) => state.auth.user)
  const userRole = useAppSelector((state) => state.auth.user?.role)
  const learner = useAppSelector((state) => state.auth.learner)

  const filteredNavGroups = React.useMemo(() => {
    const filterItems = (items: SidebarItem[]): SidebarItem[] => {
      const results: SidebarItem[] = []

      for (const item of items) {
        const childItems = item.items ? filterItems(item.items) : undefined
        const hasChildren = Boolean(childItems?.length)
        const routeRoles =
          item.url && item.url.startsWith('/')
            ? getAllowedRolesForPath(item.url)
            : undefined
        const authorized = routeRoles
          ? isRoleAllowed(userRole, routeRoles)
          : false

        if (hasChildren) {
          results.push({
            ...item,
            items: childItems,
          })
          continue
        }

        if (routeRoles && authorized) {
          results.push({
            ...item,
            items: undefined,
          })
        }
      }

      return results
    }

    // Filter groups based on user role
    const filteredGroups = data.navGroups.filter((group) => {
      // Always show "Dashboards" group
      if (group.label === 'Dashboards') {
        return true
      }
      // Show "Admin" group only for Admin role
      if (group.label === 'Admin') {
        return userRole === 'Admin'
      }
      // Show "Learner" group only for Learner role
      if (group.label === 'Learner') {
        return userRole === 'Learner'
      }
      // Show "Trainer" group only for Trainer role
      if (group.label === 'Trainer') {
        return userRole === 'Trainer'
      }
      // For other groups, show based on role access
      return true
    })

    return filteredGroups
      .map((group) => {
        const items = filterItems(group.items)
        return {
          ...group,
          items,
        }
      })
      .filter((group) => group.items.length > 0)
  }, [userRole])

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/dashboard'>
                <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                  <Lock className='h-5 w-5' />
                </div>
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-medium'>Locker</span>
                  <span className='truncate text-xs'>
                    {userRole === 'Admin'
                      ? 'Admin Dashboard'
                      : userRole === 'Trainer'
                      ? 'Trainer Dashboard'
                      : 'Learner Dashboard'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavGroups.map((group) => (
          <NavMain key={group.label} label={group.label} items={group.items} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        {/* <SidebarNotification /> */}
        {(user || learner) && <NavUser />}
      </SidebarFooter>
    </Sidebar>
  )
}
