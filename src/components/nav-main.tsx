"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "@/i18n/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { FeatureAccessWrapper } from "@/components/feature-access-wrapper"

export function NavMain({
  label,
  items,
}: {
  label: string
  items: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    featureCode?: string
    isFree?: boolean
    items?: {
      title: string
      url: string
      isActive?: boolean
      featureCode?: string
      isFree?: boolean
    }[]
  }[]
}) {
  const pathname = usePathname()

  // Check if any subitem is active to determine if parent should be open
  const shouldBeOpen = (item: typeof items[0]) => {
    if (item.isActive) return true
    return item.items?.some(subItem => pathname === subItem.url) || false
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <FeatureAccessWrapper
            key={item.title}
            featureCode={item.featureCode}
            isFree={item.isFree}
          >
            <Collapsible
              asChild
              defaultOpen={shouldBeOpen(item)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton tooltip={item.title} className="cursor-pointer">
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem) => (
                          <FeatureAccessWrapper
                            key={subItem.title}
                            featureCode={subItem.featureCode}
                            isFree={subItem.isFree}
                          >
                            <SidebarMenuSubItem>
                              <SidebarMenuSubButton asChild className="cursor-pointer" isActive={pathname === subItem.url}>
                                <Link
                                  href={subItem.url}
                                  target={(item.title === "Auth Pages" || item.title === "Errors") ? "_blank" : undefined}
                                  rel={(item.title === "Auth Pages" || item.title === "Errors") ? "noopener noreferrer" : undefined}
                                >
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </FeatureAccessWrapper>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton asChild tooltip={item.title} className="cursor-pointer" isActive={pathname === item.url}>
                    <Link href={item.url}>
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            </Collapsible>
          </FeatureAccessWrapper>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
