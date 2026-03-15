export const ROLES = {
  ADMIN: 'ADMIN',
  TRAINER: 'TRAINER',
  MEMBER: 'MEMBER',
};

export const normalizeRole = (role) => {
  if (!role || typeof role !== 'string') return null;
  return role.toUpperCase();
};

export const hasRole = (user, allowedRoles = []) => {
  const role = normalizeRole(user?.role);
  return allowedRoles.includes(role);
};
