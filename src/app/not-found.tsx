import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"
import { defaultLocale } from "@/i18n/config"

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mt-2">Page not found</p>
        <Button asChild className="mt-4">
          <Link href={`/${defaultLocale}`}>Go to Home</Link>
        </Button>
      </div>
    </div>
  )
}
