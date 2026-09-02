import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSiteTexts() {
  const [texts, setTexts] = useState({})

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase.rpc('get_public_site_texts')
      if (!cancelled && !error && data && typeof data === 'object') {
        setTexts(data)
      }
    }

    const refresh = () => void load()
    void load()
    window.addEventListener('taihenbet-content-updated', refresh)
    return () => {
      cancelled = true
      window.removeEventListener('taihenbet-content-updated', refresh)
    }
  }, [])

  return texts
}

export function useAchievementCatalog() {
  const [rows, setRows] = useState([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase.rpc('get_achievement_catalog')
      if (cancelled) return
      if (!error && Array.isArray(data)) setRows(data)
      setLoaded(true)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const map = useMemo(
    () => Object.fromEntries(rows.map((item) => [item.key, item])),
    [rows],
  )

  return { rows, map, loaded }
}

export function useCosmeticCatalogMap() {
  const [rows, setRows] = useState([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { data, error } = await supabase.rpc('get_public_cosmetic_labels')
      if (!cancelled && !error && Array.isArray(data)) {
        setRows(data)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return useMemo(
    () => Object.fromEntries(rows.map((item) => [String(item.id), item])),
    [rows],
  )
}
