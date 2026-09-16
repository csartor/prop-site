"use client"

import Link from "next/link"
import { useState } from "react"
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

const signupSchema = z
  .object({
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirmPassword: z.string(),
  })
  .refine(({ password, confirmPassword }) => password === confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

type SignupValues = z.infer<typeof signupSchema>

export function SignupForm({ ...props }: React.ComponentProps<typeof Card>) {
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [authError, setAuthError] = useState("")
  const supabase = createClient()
  const router = useRouter()
  const form = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  })

  async function signUpWithEmail({ email, password }: SignupValues) {
    setIsLoading(true)
    setAuthError("")
    setMessage("")
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    setIsLoading(false)

    if (error) {
      setAuthError(error.message)
      return
    }

    if (data.session) {
      router.push("/onboarding")
      router.refresh()
      return
    }

    setMessage("Check your email to confirm your account, then continue to onboarding.")
  }

  async function signUpWithPatreon() {
    setIsLoading(true)
    setAuthError("")

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "custom:patreon",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "identity identity[email] identity.memberships campaigns campaigns.posts",
      },
    })

    if (error) {
      setAuthError(error.message)
      setIsLoading(false)
    }
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Connect Patreon to access your membership details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={form.handleSubmit(signUpWithEmail)}>
          <FieldGroup>
            <Field data-invalid={Boolean(form.formState.errors.email)}>
              <FieldLabel htmlFor="signup-email">Email</FieldLabel>
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(form.formState.errors.email)}
                {...form.register("email")}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.password)}>
              <FieldLabel htmlFor="signup-password">Password</FieldLabel>
              <Input
                id="signup-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register("password")}
              />
              <FieldError errors={[form.formState.errors.password]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.confirmPassword)}>
              <FieldLabel htmlFor="signup-confirm-password">Confirm password</FieldLabel>
              <Input
                id="signup-confirm-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(form.formState.errors.confirmPassword)}
                {...form.register("confirmPassword")}
              />
              <FieldError errors={[form.formState.errors.confirmPassword]} />
            </Field>
            {authError ? <FieldError>{authError}</FieldError> : null}
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Sign up with email"}
            </Button>
          </FieldGroup>
        </form>
        <FieldSeparator className="my-4">or</FieldSeparator>
        <FieldGroup>
          <Field>
            <Button
              type="button"
              onClick={signUpWithPatreon}
              disabled={isLoading}
            >
              {isLoading ? "Connecting..." : "Sign up with Patreon"}
            </Button>
            <FieldDescription className="px-6 text-center">
              Already have an account?{" "}
              <Link
                href="/login"
                className="underline underline-offset-4 hover:text-foreground"
              >
                Sign in
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}
