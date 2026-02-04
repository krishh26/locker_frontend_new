import { LoginForm } from "./components/login-form"
import { Link } from "@/i18n/navigation"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium cursor-pointer">
            <Image src="/logo-text.png" alt="Locker" width={100} height={100} className="h-8 w-auto" />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <Image
          src="/online-eduction.jpg"
          alt="Image"
          fill
          className="object-cover dark:brightness-[0.95] dark:invert"
        />
      </div>
    </div>
  )
}
