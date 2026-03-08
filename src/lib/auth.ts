const AUTH_KEY = 'olhaqueduas_admin_auth';

export function checkPassword(password: string): boolean {
  const correctPassword = import.meta.env.VITE_ADMIN_PASSWORD;
  return password === correctPassword;
}

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export function setAuthenticated(value: boolean): void {
  if (value) {
    localStorage.setItem(AUTH_KEY, 'true');
  } else {
    localStorage.removeItem(AUTH_KEY);
  }
}

export function logout(): void {
  setAuthenticated(false);
}
