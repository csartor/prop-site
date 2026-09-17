export type DirectoryUtm = {
  utm_source: string
  utm_medium: string
  utm_campaign: string
}

export const defaultDirectoryUtm: DirectoryUtm = {
  utm_source: "makersforge",
  utm_medium: "directory",
  utm_campaign: "maker-directory",
}

export function withDirectoryUtm(
  href: string,
  content: string,
  utm: DirectoryUtm = defaultDirectoryUtm,
) {
  try {
    const url = new URL(href)
    const tags = {
      utm_source: utm.utm_source,
      utm_medium: utm.utm_medium,
      utm_campaign: utm.utm_campaign,
      utm_content: content,
    }

    for (const [key, value] of Object.entries(tags)) {
      if (value && !url.searchParams.has(key)) {
        url.searchParams.set(key, value)
      }
    }

    return url.toString()
  } catch {
    return href
  }
}

export function normalizeDirectoryUtm(
  value: Partial<DirectoryUtm> | null | undefined,
): DirectoryUtm {
  return {
    utm_source: value?.utm_source || defaultDirectoryUtm.utm_source,
    utm_medium: value?.utm_medium || defaultDirectoryUtm.utm_medium,
    utm_campaign: value?.utm_campaign || defaultDirectoryUtm.utm_campaign,
  }
}
