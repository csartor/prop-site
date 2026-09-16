import "jsr:@supabase/functions-js/edge-runtime.d.ts"

type PatreonIdentity = {
  data?: {
    id?: string
    attributes?: Record<string, unknown>
  }
}

Deno.serve(async (request) => {
  if (request.method !== "GET") {
    return new Response("Method not allowed", {
      status: 405,
      headers: { Allow: "GET" },
    })
  }

  const authorization = request.headers.get("authorization")

  if (!authorization?.startsWith("Bearer ")) {
    return Response.json({ error: "Missing Patreon bearer token" }, { status: 401 })
  }

  const params = new URLSearchParams({
    "fields[user]": "email,full_name,first_name,last_name,image_url,vanity",
  })
  const patreonResponse = await fetch(
    `https://www.patreon.com/api/oauth2/v2/identity?${params.toString()}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
    }
  )

  if (!patreonResponse.ok) {
    return Response.json(
      { error: "Patreon profile request failed" },
      { status: patreonResponse.status }
    )
  }

  const payload = (await patreonResponse.json()) as PatreonIdentity
  const id = payload.data?.id
  const attributes = payload.data?.attributes ?? {}

  if (!id) {
    return Response.json({ error: "Patreon profile has no stable id" }, { status: 502 })
  }

  const fullName =
    typeof attributes.full_name === "string" ? attributes.full_name : undefined
  const email = typeof attributes.email === "string" ? attributes.email : undefined
  const picture =
    typeof attributes.image_url === "string" ? attributes.image_url : undefined

  return Response.json({
    id,
    sub: id,
    provider_id: id,
    email,
    name: fullName,
    picture,
    user_name:
      typeof attributes.vanity === "string" ? attributes.vanity : undefined,
  })
})
