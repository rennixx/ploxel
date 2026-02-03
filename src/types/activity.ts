import type { Bounds } from '@/lib/globe-utils'

export interface Activity {
  id: string
  drawing_id: string
  user_id: string
  action: string
  metadata: {
    location?: Bounds
    [key: string]: unknown
  }
  created_at: string
}
