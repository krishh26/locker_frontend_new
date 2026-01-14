"use client"

import { Users, Mail, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { Supervisor } from "../data/course-details-data"

interface SupervisorCardsProps {
  supervisors: Supervisor[]
}

function initialsFromName(firstName?: string, lastName?: string) {
  const first = firstName?.charAt(0)?.toUpperCase() || ""
  const last = lastName?.charAt(0)?.toUpperCase() || ""
  return first + last || "?"
}

export function SupervisorCards({ supervisors }: SupervisorCardsProps) {
  if (supervisors.length === 0) return null

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Learner Supervisors</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {supervisors.map((supervisor) => {
          const displayName =
            supervisor.role?.includes("Employer") && supervisor.employer?.employer_name
              ? supervisor.employer.employer_name
              : `${supervisor.first_name || ""} ${supervisor.last_name || ""}`.trim()

          return (
            <Card
              key={supervisor.user_id}
              className="border border-border/60 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14 border-2 border-primary/20">
                    <AvatarImage
                      src={supervisor.avatar?.url}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initialsFromName(supervisor.first_name, supervisor.last_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {displayName || "Unknown"}
                      </h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {supervisor.role?.map((role) => (
                          <Badge
                            key={role}
                            variant="secondary"
                            className="text-xs rounded-full"
                          >
                            {role}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {supervisor.email && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-4 w-4 text-primary" />
                        <span className="truncate">{supervisor.email}</span>
                      </div>
                    )}
                    {supervisor.mobile && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4 text-primary" />
                        <span>{supervisor.mobile}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

