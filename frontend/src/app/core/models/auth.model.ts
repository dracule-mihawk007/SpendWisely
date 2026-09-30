export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  name: string;
  email: string;
  userId: number;
  expiresAt: string;
}

export interface UserProfileDto {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}
