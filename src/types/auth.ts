export interface User {
  id: string
  email: string
  name: string
  createdAt: number
}

export interface LoginResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RegisterResponse {
  user: User
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface RefreshResponse {
  accessToken: string
  expiresIn: number
}
