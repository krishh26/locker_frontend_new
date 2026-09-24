import { Heart } from "lucide-react"
import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t bg-background">
      <div className="flex items-center justify-center px-4 py-3 lg:px-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Made with</span>
          <Heart className="h-4 w-4 fill-destructive text-destructive" />
          <span>by</span>
          <Link
            href="https://whyqtech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:text-primary transition-colors"
          >
            Locker Team
          </Link>
        </div>
      </div>
    </footer>
  )
}
