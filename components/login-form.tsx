"use client"

import Link from "next/link"
import { useState } from "react"
import { cn } from "cn"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  error,
  ...props
}: React.ComponentProps<"div"> & { error?: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState("")
  const router = useRouter()
  const supabase = createClient()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  async function signInWithEmail({ email, password }: LoginValues) {
    setIsLoading(true)
    setAuthError("")
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setIsLoading(false)
    if (signInError) {
      setAuthError(signInError.message)
      return
    }
    router.push("/")
    router.refresh()
  }

  async function signInWithPatreon() {
    setIsLoading(true)
    setAuthError("")

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "custom:patreon",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "identity identity[email] identity.memberships campaigns campaigns.posts",
      },
    })

    if (signInError) {
      setAuthError(signInError.message)
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle>Continue with Patreon</CardTitle>
          <CardDescription>
            Sign in to see the Patreon memberships connected to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form noValidate onSubmit={form.handleSubmit(signInWithEmail)}>
            <FieldGroup>
              <Field data-invalid={Boolean(form.formState.errors.email)}>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <Input id="login-email" type="email" autoComplete="email" aria-invalid={Boolean(form.formState.errors.email)} {...form.register("email")} />
                <FieldError errors={[form.formState.errors.email]} />
              </Field>
              <Field data-invalid={Boolean(form.formState.errors.password)}>
                <FieldLabel htmlFor="login-password">Password</FieldLabel>
                <Input id="login-password" type="password" autoComplete="current-password" aria-invalid={Boolean(form.formState.errors.password)} {...form.register("password")} />
                <FieldError errors={[form.formState.errors.password]} />
              </Field>
              {authError ? <FieldError>{authError}</FieldError> : null}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in with email"}
              </Button>
            </FieldGroup>
          </form>
          <FieldSeparator className="my-4">or</FieldSeparator>
          <FieldGroup>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Field>
              <Button
                type="button"
                onClick={signInWithPatreon}
                disabled={isLoading}
              >
                {isLoading ? "Connecting..." : "Sign in with Patreon"}
              </Button>
              <FieldDescription className="text-center">
                New here?{" "}
                <Link
                  href="/signup"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Create an account
                </Link>
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  )
}
