"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/client";

const schema = z
  .object({
    title: z.string().min(3).max(160),
    category: z.string().min(1, "Choose a category."),
    description: z.string().min(20, "Tell makers a little more.").max(5000),
    intent: z.enum(["wearable", "display_only", "either"]),
    finish_tier: z.enum(["raw", "paint_ready", "display", "screen_accurate"]),
    deadline: z.string().min(1, "Choose a deadline."),
    budget_min: z.coerce.number().min(0),
    budget_max: z.coerce.number().min(0),
    buyer_location: z.string().min(2),
    fulfillment_method: z.enum(["shipping", "pickup", "either"]),
    measurements: z.string(),
    functionality_needs: z.string(),
    file_ownership: z.enum(["none", "own_stl", "licensed_stl", "custom_files"]),
    contact_name: z.string().min(2),
    contact_email: z.string().email(),
    contact_method: z.enum(["email", "discord", "instagram"]),
    contact_handle: z.string(),
    reference_url: z
      .string()
      .url("Add a valid reference URL.")
      .or(z.literal("")),
  })
  .refine((value) => value.budget_max >= value.budget_min, {
    path: ["budget_max"],
    message: "Maximum must be at least the minimum.",
  });

type Values = z.infer<typeof schema>;

export function BuyerRequestForm({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [files, setFiles] = useState<File[]>([]);
  const [message, setMessage] = useState("");
  const form = useForm<Values>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      title: "",
      category: "",
      description: "",
      intent: "wearable",
      finish_tier: "display",
      deadline: "",
      budget_min: 0,
      budget_max: 0,
      buyer_location: "",
      fulfillment_method: "shipping",
      measurements: "",
      functionality_needs: "",
      file_ownership: "none",
      contact_name: "",
      contact_email: email,
      contact_method: "email",
      contact_handle: "",
      reference_url: "",
    },
  });

  async function next() {
    const fields =
      step === 1
        ? ([
            "title",
            "category",
            "description",
            "intent",
            "finish_tier",
          ] as const)
        : step === 2
          ? ([
              "deadline",
              "budget_min",
              "budget_max",
              "buyer_location",
              "fulfillment_method",
              "file_ownership",
            ] as const)
          : ([
              "contact_name",
              "contact_email",
              "contact_method",
              "reference_url",
            ] as const);
    if (await form.trigger(fields)) setStep((value) => Math.min(3, value + 1));
  }

  async function submit(values: Values) {
    if (!values.reference_url && files.length === 0) {
      form.setError("reference_url", {
        message: "Add a reference URL or upload an image.",
      });
      return;
    }
    setMessage("Submitting…");
    const supabase = createClient();
    const { data: request, error } = await supabase
      .from("buyer_requests")
      .insert({
        buyer_user_id: userId,
        title: values.title,
        category: values.category,
        description: values.description,
        intent: values.intent,
        finish_tier: values.finish_tier,
        deadline: values.deadline,
        budget_min_cents: Math.round(values.budget_min * 100),
        budget_max_cents: Math.round(values.budget_max * 100),
        buyer_location: values.buyer_location,
        fulfillment_method: values.fulfillment_method,
        measurements: values.measurements || null,
        functionality_needs: values.functionality_needs || null,
        file_ownership: values.file_ownership,
        contact_name: values.contact_name,
        contact_email: values.contact_email,
        contact_method: values.contact_method,
        contact_handle: values.contact_handle || null,
      })
      .select("id")
      .single();
    if (error || !request) {
      setMessage(error?.message ?? "Could not save your request.");
      return;
    }
    const references: {
      buyer_request_id: string;
      kind: "url" | "upload";
      value: string;
      sort_order: number;
    }[] = [];
    if (values.reference_url)
      references.push({
        buyer_request_id: request.id,
        kind: "url",
        value: values.reference_url,
        sort_order: 0,
      });
    for (const [index, file] of files.entries()) {
      const path = `${userId}/${request.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("buyer-request-references")
        .upload(path, file);
      if (uploadError) {
        setMessage(uploadError.message);
        return;
      }
      references.push({
        buyer_request_id: request.id,
        kind: "upload",
        value: path,
        sort_order: references.length + index,
      });
    }
    const { error: referenceError } = await supabase
      .from("buyer_request_references")
      .insert(references);
    if (referenceError) {
      setMessage(referenceError.message);
      return;
    }
    router.push(`/requests/${request.id}`);
    router.refresh();
  }

  const error = (name: keyof Values) => form.formState.errors[name];
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Request a custom build · Step {step} of 3</CardTitle>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={form.handleSubmit(submit)}>
          <FieldGroup>
            {step === 1 ? (
              <>
                <Field data-invalid={Boolean(error("title"))}>
                  <FieldLabel htmlFor="title">Project title</FieldLabel>
                  <Input
                    id="title"
                    {...form.register("title")}
                    aria-invalid={Boolean(error("title"))}
                  />
                  {error("title") ? (
                    <FieldError errors={[error("title")]} />
                  ) : null}
                </Field>
                <Controller
                  name="category"
                  control={form.control}
                  render={({ field }) => (
                    <Field data-invalid={Boolean(error("category"))}>
                      <FieldLabel>Category</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Helmet">Helmet</SelectItem>
                          <SelectItem value="Armor">Armor</SelectItem>
                          <SelectItem value="Weapon prop">
                            Weapon prop
                          </SelectItem>
                          <SelectItem value="Creature / mask">
                            Creature / mask
                          </SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      {error("category") ? (
                        <FieldError errors={[error("category")]} />
                      ) : null}
                    </Field>
                  )}
                />
                <Field>
                  <FieldLabel htmlFor="description">Description</FieldLabel>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                  />
                </Field>
                <Controller
                  name="intent"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Wearable or display-only</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wearable">Wearable</SelectItem>
                          <SelectItem value="display_only">
                            Display-only
                          </SelectItem>
                          <SelectItem value="either">Either</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Controller
                  name="finish_tier"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Finish tier</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="raw">Raw kit</SelectItem>
                          <SelectItem value="paint_ready">
                            Paint ready
                          </SelectItem>
                          <SelectItem value="display">Display ready</SelectItem>
                          <SelectItem value="screen_accurate">
                            Screen accurate
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </>
            ) : null}
            {step === 2 ? (
              <>
                <Field>
                  <FieldLabel htmlFor="deadline">Deadline</FieldLabel>
                  <Input
                    id="deadline"
                    type="date"
                    {...form.register("deadline")}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="budget-min">
                      Budget minimum (USD)
                    </FieldLabel>
                    <Input
                      id="budget-min"
                      type="number"
                      min="0"
                      {...form.register("budget_min")}
                    />
                  </Field>
                  <Field data-invalid={Boolean(error("budget_max"))}>
                    <FieldLabel htmlFor="budget-max">
                      Budget maximum (USD)
                    </FieldLabel>
                    <Input
                      id="budget-max"
                      type="number"
                      min="0"
                      {...form.register("budget_max")}
                    />
                    {error("budget_max") ? (
                      <FieldError errors={[error("budget_max")]} />
                    ) : null}
                  </Field>
                </div>
                <Field>
                  <FieldLabel htmlFor="buyer-location">
                    Your location
                  </FieldLabel>
                  <Input
                    id="buyer-location"
                    {...form.register("buyer_location")}
                  />
                </Field>
                <Controller
                  name="fulfillment_method"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Fulfillment</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="shipping">Shipping</SelectItem>
                          <SelectItem value="pickup">Pickup</SelectItem>
                          <SelectItem value="either">Either</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Field>
                  <FieldLabel>Measurements</FieldLabel>
                  <Textarea {...form.register("measurements")} />
                </Field>
                <Field>
                  <FieldLabel>Electronics or functionality</FieldLabel>
                  <Textarea {...form.register("functionality_needs")} />
                </Field>
                <Controller
                  name="file_ownership"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Existing files</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No files</SelectItem>
                          <SelectItem value="own_stl">I own the STL</SelectItem>
                          <SelectItem value="licensed_stl">
                            I have a licensed STL
                          </SelectItem>
                          <SelectItem value="custom_files">
                            Custom files
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </>
            ) : null}
            {step === 3 ? (
              <>
                <Field data-invalid={Boolean(error("reference_url"))}>
                  <FieldLabel htmlFor="reference-url">Reference URL</FieldLabel>
                  <Input
                    id="reference-url"
                    type="url"
                    {...form.register("reference_url")}
                  />
                  {error("reference_url") ? (
                    <FieldError errors={[error("reference_url")]} />
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="reference-files">
                    Or upload reference images
                  </FieldLabel>
                  <Input
                    id="reference-files"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) =>
                      setFiles(Array.from(event.target.files ?? []))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contact-name">Contact name</FieldLabel>
                  <Input id="contact-name" {...form.register("contact_name")} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="contact-email">Contact email</FieldLabel>
                  <Input
                    id="contact-email"
                    type="email"
                    {...form.register("contact_email")}
                  />
                </Field>
                <Controller
                  name="contact_method"
                  control={form.control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel>Preferred contact method</FieldLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="discord">Discord</SelectItem>
                          <SelectItem value="instagram">Instagram</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
                <Field>
                  <FieldLabel htmlFor="contact-handle">
                    Contact handle (if applicable)
                  </FieldLabel>
                  <Input
                    id="contact-handle"
                    {...form.register("contact_handle")}
                  />
                </Field>
              </>
            ) : null}
            {message ? (
              <p className="text-sm text-muted-foreground">{message}</p>
            ) : null}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((value) => Math.max(1, value - 1))}
                disabled={step === 1}
              >
                Back
              </Button>
              {step < 3 ? (
                <Button type="button" onClick={next}>
                  Continue
                </Button>
              ) : (
                <Button type="submit">Submit request</Button>
              )}
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}
