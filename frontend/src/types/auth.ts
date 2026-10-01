export type Role = "user" | string;

export interface AuthUser {
  _id: string;
  id: string;
  name: string;
  email: string;
  photo?: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
  __v?: number;
  passwordChangedAt?: string;
  refreshTokenExpiresAt?: string;
}

export interface AuthTokens {
  accessToken?: string;
  refreshToken?: string;
}

export interface LoginResponse {
  status: number;
  message: string;
  data: {
    user: AuthUser;
    tokens?: AuthTokens;
  };
}
