// ======================================================
// Role Constants and Helpers
// ======================================================

export const ROLES = {
    SUPER_ADMIN: "super_admin",
    ADMIN: "admin",
    TEACHER: "teacher",
    STUDENT: "student",
    PARENT: "parent",
};

export const SUPER_ADMIN_ROLE = ROLES.SUPER_ADMIN;

export const ADMIN_ROLES = [ROLES.SUPER_ADMIN, ROLES.ADMIN];

export const isActiveRole = (role, roles) => roles.includes(role);

export const isAdminRole = (role) =>
    ADMIN_ROLES.includes(role);

export const isSuperAdmin = (role) => role === ROLES.SUPER_ADMIN;

/**
 * Role authorization matcher.
 * A super admin satisfies any authorization that accepts `admin`,
 * without inheriting non-staff roles such as student/parent.
 */
export const matchesRole = (userRole, allowedRoles = []) =>
    userRole === ROLES.SUPER_ADMIN
        ? allowedRoles.includes(
              ROLES.SUPER_ADMIN
          ) || allowedRoles.includes(ROLES.ADMIN)
        : allowedRoles.includes(userRole);
