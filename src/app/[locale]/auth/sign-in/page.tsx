import { LoginForm } from "./components/login-form"
import { Link } from "@/i18n/navigation"
import Image from "next/image"

export default function LoginPage() {
  return (
    <div className="grid min-h-svh overflow-x-hidden lg:grid-cols-[2fr_3fr]">
      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-6 lg:p-8">
        <div className="flex justify-center lg:justify-start">
          <Link
            href="/"
            className="flex cursor-pointer items-center gap-2 font-medium"
          >
            <Image
              src="/logo-text.png"
              alt="Locker"
              width={100}
              height={100}
              className="h-12 w-auto lg:h-14"
              priority
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-sm lg:max-w-md">
            <LoginForm />
          </div>
        </div>
      </div>

      <div className="relative hidden min-h-svh min-w-0 overflow-hidden lg:block">
        <Image
          src="/online-eduction-v1.jpg"
          alt="Online education platform"
          fill
          priority
          sizes="(min-width: 1024px) 60vw, 0vw"
          className="object-cover object-center"
        />
      </div>
    </div>
  )
}
