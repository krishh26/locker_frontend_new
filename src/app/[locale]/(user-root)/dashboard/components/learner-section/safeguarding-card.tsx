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
import { useGetSafeguardingContactsQuery } from "@/store/api/safeguarding/safeguardingApi"
import { Skeleton } from "@/components/ui/skeleton"

export function SafeguardingCard() {
  const { data, isLoading, isError } = useGetSafeguardingContactsQuery()
  
  // Get the first active contact or use placeholder
  const safeguardingContact = data?.data?.[0] || {
    telNumber: "020 7946 0144",
    mobileNumber: "07945 221 890",
    emailAddress: "safeguarding@locker.edu",
    additionalInfo: "Available Mon - Fri, 08:30 - 18:00. Response within 2 working hours.",
  }

  if (isLoading) {
    return (
      <Card className="h-full shadow-sm bg-linear-to-br from-rose-100 to-pink-100 dark:from-rose-950/50 dark:to-pink-950/40 border-rose-300/60 dark:border-rose-800/30">
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="w-full space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    )
  }
  return (
    <Card className="h-full shadow-sm bg-linear-to-br from-rose-100 to-pink-100 dark:from-rose-950/50 dark:to-pink-950/40 border-rose-300/60 dark:border-rose-800/30">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle className="text-xl">Safeguarding contact</CardTitle>
          <CardDescription>
            Reach out immediately if you have any concerns
          </CardDescription>
        </div>
        <Badge variant="secondary" className="rounded-full shadow-sm bg-rose-200/80 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
          Priority support
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3 rounded-lg border border-dashed border-rose-200/60 dark:border-rose-800/30 bg-rose-50/60 dark:bg-rose-950/30 p-4">
          <div className="rounded-full p-2 bg-linear-to-br from-rose-400 to-pink-500 text-white shadow-sm mt-0.5">
            <ShieldAlert className="size-4" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-foreground">Safeguarding Lead</p>
            <p className="text-sm text-muted-foreground">Designated Safeguarding Lead</p>
          </div>
        </div>

        <Separator className="bg-rose-200/60 dark:bg-rose-800/30" />

        <div className="grid gap-3 text-sm">
          {safeguardingContact.telNumber && (
            <div className="flex items-center gap-2 rounded-md border border-rose-200/60 dark:border-rose-800/30 bg-white/60 dark:bg-white/5 p-3">
              <Phone className="size-4 text-rose-600 dark:text-rose-400" />
              <span className="font-medium text-foreground">Tel:</span>
              <span>{safeguardingContact.telNumber}</span>
            </div>
          )}

          {safeguardingContact.mobileNumber && (
            <div className="flex items-center gap-2 rounded-md border border-rose-200/60 dark:border-rose-800/30 bg-white/60 dark:bg-white/5 p-3">
              <Phone className="size-4 text-rose-600 dark:text-rose-400" />
              <span className="font-medium text-foreground">Mobile:</span>
              <span>{safeguardingContact.mobileNumber}</span>
            </div>
          )}

          {safeguardingContact.emailAddress && (
            <div className="flex items-center gap-2 rounded-md border border-rose-200/60 dark:border-rose-800/30 bg-white/60 dark:bg-white/5 p-3">
              <Mail className="size-4 text-rose-600 dark:text-rose-400" />
              <span className="font-medium text-foreground">Email:</span>
              <a
                className="text-rose-600 dark:text-rose-400 underline-offset-4 hover:underline"
                href={`mailto:${safeguardingContact.emailAddress}`}
              >
                {safeguardingContact.emailAddress}
              </a>
            </div>
          )}
        </div>

        {safeguardingContact.additionalInfo && (
          <>
            <Separator className="bg-rose-200/60 dark:bg-rose-800/30" />
            <div className="rounded-lg border border-dashed border-rose-200/60 dark:border-rose-800/30 bg-rose-50/50 dark:bg-rose-950/20 p-4 text-sm">
              <p className="text-muted-foreground whitespace-pre-line">{safeguardingContact.additionalInfo}</p>
            </div>
          </>
        )}

        {isError && (
          <div className="text-sm text-muted-foreground italic">
            Using default contact information. Please contact your administrator if you need assistance.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

