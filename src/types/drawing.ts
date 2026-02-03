export interface Drawing {
  id: string
  user_id: string
  image_url: string
  latitude: number
  longitude: number
  bounds: {
    north: number
    south: number
    east: number
    west: number
  }
  created_at: string
  enhanced: boolean
  original_image_url?: string
}
