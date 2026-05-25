export const ADMIN_EMAIL = "ds9376314@gmail.com";

export function isSiteAdmin(email) {
  return String(email || "").trim().toLowerCase() === ADMIN_EMAIL;
}
