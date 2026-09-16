<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Always use supabase MCP

## UI and form standards

- Use the project's shadcn/ui theme and component library for every UI change.
  Reuse its installed primitives first; add missing components through the
  shadcn CLI rather than creating parallel custom primitives.
- Use `@phosphor-icons/react` for all application UI icons. Preserve exported
  design assets only when they are a unique brand/design asset rather than a
  standard interface icon.
- Build all user-input forms with React Hook Form and Zod. Define a Zod schema
  for form values, use `zodResolver`, and surface validation feedback through
  shadcn form controls.
- Keep the selected shadcn create preset/theme as the source of truth for
  component styling and tokens. Extend it only with semantic project tokens
  when a design requires an additional reusable color or value.