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
      <SidebarGroupLabel className="h-auto min-h-8 whitespace-normal py-1 leading-snug">
        {label}
      </SidebarGroupLabel>
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
                      <SidebarMenuButton
                        tooltip={item.title}
                        className="relative cursor-pointer gap-2 pr-9"
                      >
                        {item.icon && <item.icon className="shrink-0" />}
                        <span className="min-w-0 flex-1 truncate text-left leading-snug">
                          {item.title}
                        </span>
                        <ChevronRight className="absolute right-2 top-1/2 size-4 shrink-0 -translate-y-1/2 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
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
                                  <span className="min-w-0 flex-1 truncate text-left leading-snug">
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          </FeatureAccessWrapper>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : (
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    className="cursor-pointer gap-2"
                    isActive={pathname === item.url}
                  >
                    <Link href={item.url}>
                      {item.icon && <item.icon className="shrink-0" />}
                      <span className="min-w-0 flex-1 truncate text-left leading-snug">
                        {item.title}
                      </span>
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
