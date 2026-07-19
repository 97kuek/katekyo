export const cacheProfiles = {
  notifications: { stale: 15, revalidate: 30, expire: 5 * 60 },
  active: { stale: 30, revalidate: 60, expire: 60 * 60 },
  reference: { stale: 5 * 60, revalidate: 30 * 60, expire: 24 * 60 * 60 },
} as const
