export type PageKey =
  | 'home'
  | 'auth'
  | 'dashboard'
  | 'create'
  | 'credits'
  | 'history'
  | 'payment-success'

export type StyleCategory = 'character_transform' | 'art_illustration'

export type HistoryItem = {
  id: string
  createdAt: string
  festival: string
  styleName: string
  creditsUsed: number
  status: 'succeeded' | 'failed'
  shareLink: string
}
