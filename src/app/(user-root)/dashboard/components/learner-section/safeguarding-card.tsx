"use client"

import { Mail, Phone, ShieldAlert, User2 } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// TODO: Fetch actual safeguarding contact from API
const safeguardingContact = {
  name: "Safeguarding Lead",
  role: "Designated Safeguarding Lead",
  tel: "020 7946 0144",
  mobile: "07945 221 890",
  email: "safeguarding@locker.edu",
  responseTime: "Within 2 working hours",
  coverage: "Mon - Fri, 08:30 - 18:00",
}

export function SafeguardingCard() {
  return (
    <Card className="h-full border border-border/60 shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-xl">Safeguarding contact</CardTitle>
          <CardDescription>
            Reach out immediately if you have any concerns
          </CardDescription>
        </div>
        <Badge variant="secondary" className="rounded-full">
          Priority support
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-border/60 bg-muted/20 p-4">
          <ShieldAlert className="mt-1 size-5 text-primary" />
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">{safeguardingContact.name}</p>
            <p className="text-sm text-muted-foreground">{safeguardingContact.role}</p>
          </div>
        </div>

        <Separator />

        <div className="grid gap-3 text-sm">
          {safeguardingContact.tel && (
            <div className="flex items-center gap-2 rounded-md border border-border/60 p-3">
              <Phone className="size-4 text-primary" />
              <span className="font-medium text-foreground">Tel:</span>
              <span>{safeguardingContact.tel}</span>
            </div>
          )}

          {safeguardingContact.mobile && (
            <div className="flex items-center gap-2 rounded-md border border-border/60 p-3">
              <Phone className="size-4 text-primary" />
              <span className="font-medium text-foreground">Mobile:</span>
              <span>{safeguardingContact.mobile}</span>
            </div>
          )}

          {safeguardingContact.email && (
            <div className="flex items-center gap-2 rounded-md border border-border/60 p-3">
              <Mail className="size-4 text-primary" />
              <span className="font-medium text-foreground">Email:</span>
              <a
                className="text-primary underline-offset-4 hover:underline"
                href={`mailto:${safeguardingContact.email}`}
              >
                {safeguardingContact.email}
              </a>
            </div>
          )}
        </div>

        <Separator />

        <div className="grid gap-2 rounded-lg border border-dashed border-border/60 bg-muted/30 p-4 text-sm">
          <div className="flex items-center gap-2">
            <User2 className="size-4 text-primary" />
            <span className="font-medium text-foreground">Response time:</span>
            <span className="text-muted-foreground">{safeguardingContact.responseTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <User2 className="size-4 text-primary" />
            <span className="font-medium text-foreground">Coverage:</span>
            <span className="text-muted-foreground">{safeguardingContact.coverage}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

