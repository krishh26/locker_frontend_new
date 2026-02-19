"use client"

import { ShieldX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

interface AccessDeniedProps {
  title?: string
  message?: string
  showBackButton?: boolean
  className?: string
}

/**
 * Reusable component shown when a 403 Forbidden response is received.
 * Used when centre/org scoped users try to access resources outside their scope.
 */
export function AccessDenied({
  title = "Access Denied",
  message = "You don't have permission to view this resource. It may be outside your assigned centre or organisation scope.",
  showBackButton = true,
  className,
}: AccessDeniedProps) {
  const router = useRouter()

  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-4", className)}>
      <Alert variant="destructive" className="max-w-lg">
        <ShieldX className="h-4 w-4" />
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>
          <p>{message}</p>
          {showBackButton && (
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          )}
        </AlertDescription>
      </Alert>
    </div>
  )
}
