/**
 * frontend/src/hooks/usePremiumBadges.js
 *
 * Query premium status for a list of usernames or user IDs:
 * - In-memory cache to avoid redundant requests
 * - Batch fetching with 5-minute TTL
 */

import { useState, useEffect } from 'react'
import api from '../utils/api'

const cache = new Map()
const slotCache = new Map()
const cacheExpiry = new Map()
const TTL = 5 * 60 * 1000

export function usePremiumBadges(usernames = [], ids = []) {
  const [badgeMap, setBadgeMap] = useState({})

  const cleanUsernamesKey = Array.isArray(usernames) ? usernames.join(',') : String(usernames)
  const cleanIdsKey = Array.isArray(ids) ? ids.join(',') : String(ids)

  useEffect(() => {
    const cleanUsernames = (Array.isArray(usernames) ? usernames : [usernames])
      .filter(Boolean)
      .map(u => String(u).trim().toLowerCase())
    const cleanIds = (Array.isArray(ids) ? ids : [ids])
      .filter(Boolean)
      .map(s => String(s).trim())

    if (cleanUsernames.length === 0 && cleanIds.length === 0) {
      return
    }

    const now = Date.now()
    const missingUsernames = cleanUsernames.filter(u => !cache.has(`u:${u}`) || (cacheExpiry.get(`u:${u}`) || 0) < now)
    const missingIds = cleanIds.filter(id => !cache.has(`id:${id}`) || (cacheExpiry.get(`id:${id}`) || 0) < now)

    if (missingUsernames.length === 0 && missingIds.length === 0) {
      const nextMap = {}
      for (const u of cleanUsernames) {
        nextMap[u] = cache.get(`u:${u}`) || false
        if (slotCache.has(`u:${u}`)) nextMap[`slot:${u}`] = slotCache.get(`u:${u}`)
      }
      for (const id of cleanIds) {
        nextMap[id] = cache.get(`id:${id}`) || false
        if (slotCache.has(`id:${id}`)) nextMap[`slot:${id}`] = slotCache.get(`id:${id}`)
      }
      setBadgeMap(nextMap)
      return
    }

    let isMounted = true
    const params = new URLSearchParams()
    if (missingUsernames.length > 0) params.set('usernames', missingUsernames.join(','))
    if (missingIds.length > 0) params.set('ids', missingIds.join(','))

    api.get(`/api/premium/badges?${params.toString()}`)
      .then(({ data }) => {
        if (!isMounted) return
        const pIds = new Set(data?.premiumUserIds || [])
        const pUsers = new Set((data?.premiumUsernames || []).map(u => u.toLowerCase()))
        const slots = data?.slots || {}

        for (const u of missingUsernames) {
          cache.set(`u:${u}`, pUsers.has(u))
          if (slots[u]) slotCache.set(`u:${u}`, slots[u])
          cacheExpiry.set(`u:${u}`, now + TTL)
        }
        for (const id of missingIds) {
          cache.set(`id:${id}`, pIds.has(id))
          if (slots[id]) slotCache.set(`id:${id}`, slots[id])
          cacheExpiry.set(`id:${id}`, now + TTL)
        }

        const nextMap = {}
        for (const u of cleanUsernames) {
          nextMap[u] = cache.get(`u:${u}`) || false
          if (slotCache.has(`u:${u}`)) nextMap[`slot:${u}`] = slotCache.get(`u:${u}`)
        }
        for (const id of cleanIds) {
          nextMap[id] = cache.get(`id:${id}`) || false
          if (slotCache.has(`id:${id}`)) nextMap[`slot:${id}`] = slotCache.get(`id:${id}`)
        }
        setBadgeMap(nextMap)
      })
      .catch(() => {
        // Soft fallback
      })

    return () => {
      isMounted = false
    }
  }, [cleanUsernamesKey, cleanIdsKey])

  return badgeMap
}

