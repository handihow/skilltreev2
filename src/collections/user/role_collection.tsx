import { buildCollection, buildEntityCallbacks } from "firecms";

const roleCallbacks = buildEntityCallbacks({
    onPreSave: ({
        entityId,
        values,
        status,
        context
    }) => {
        if (status === "new" && entityId === "admin" && !context.authController.extra?.roles.includes("admin"))
            throw Error("Only Admins can assign the Admin role. Please contact support if you require Admin rights.");
        if (status === "new" && entityId === "super" && !context.authController.extra?.roles.includes("super"))
            throw Error("Only Super Admins can assign the Super Admin role. Please contact support if you require Super Admin rights.");
        return values;
    }
});

const roles = {
    "student": "Student",
    "instructor": "Instructor",
    "admin": "Admin",
    "super": "Super Admin"
};

export const rolesCollection = buildCollection({
    path: "roles",
    customId: roles,
    name: "Roles",
    singularName: "Role",
    properties: {
        hasRole: {
            name: "Has role",
            description: "User has this role",
            dataType: "boolean"
        }
    },
    callbacks: roleCallbacks
});
