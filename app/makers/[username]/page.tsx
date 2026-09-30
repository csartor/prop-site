import { permanentRedirect } from "next/navigation"

export default async function MakerProfileRedirect({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const { username } = await params
  permanentRedirect(`/${username}`)
}
