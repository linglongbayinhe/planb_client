export type AuthProvider = 'weixin' | 'toutiao' | 'xiaohongshu'

export interface ProviderIdentity {
  provider: AuthProvider
  openid: string
  unionid?: string
  sessionKey?: string
  raw?: Record<string, any>
}

export interface AuthProviderLoginResponse {
  code: 0 | 1 | 2 | 3
  message: string
  token?: string
  tokenExpired?: number
  userInfo?: {
    _id: string
    email?: string
    nickname?: string
    avatar?: string
  }
  provider?: ProviderIdentity
}

export interface UserBootstrapResponse {
  errCode: 0 | string
  errMsg: string
  userInfo?: {
    _id: string
    email?: string
    nickname?: string
    avatar?: string
  }
  plan?: {
    enabled: boolean
    sendDate: string | null
    emails: string[]
    phones: string[]
    displayName: string
    customGuide: string
  }
}

