<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Always use supabase MCP

## UI and form standards

- Always use shadcn/ui for every UI primitive that shadcn provides (Button,
  Input, Select, Card, Dialog, Tabs, Badge, Form/Field, Combobox, Table, and
  the rest). Do not invent a parallel custom component, raw HTML control, or
  one-off styled element when a shadcn primitive can do the job.
- Reuse installed primitives from `components/ui/` first. If the needed
  component is not installed, add it with the shadcn CLI
  (`npx shadcn@latest add <component>`) before writing any custom markup.
- Custom components are allowed only when shadcn has no equivalent. Even then,
  compose them from shadcn primitives, the project theme tokens, and
  `@phosphor-icons/react` instead of building new base controls.
- Use `@phosphor-icons/react` for all application UI icons. Preserve exported
  design assets only when they are a unique brand/design asset rather than a
  standard interface icon.
- Build all user-input forms with React Hook Form and Zod. Define a Zod schema
  for form values, use `zodResolver`, and surface validation feedback through
  shadcn form controls.
- Keep the selected shadcn create preset/theme as the source of truth for
  component styling and tokens. Extend it only with semantic project tokens
  when a design requires an additional reusable color or value.