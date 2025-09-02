export interface AuthResponse {
  token: string;
  role: 'admin' | 'operator' | 'user' | string;
  userId: string | null;
  operatorId?: number | null;
}

export interface RegisterDto {
  email: string;
  password: string;
  role: string;
}
export interface LoginDto {
  email: string;
  password: string;
}
