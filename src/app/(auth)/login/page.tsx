import { Suspense } from "react"
import LoginForm from "./login-form"
import { googleAuthEnabled } from "@/lib/auth"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm googleEnabled={googleAuthEnabled} />
    </Suspense>
  )
}
