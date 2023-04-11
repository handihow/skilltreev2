import { buildCollection, buildEntityCallbacks } from "firecms";
import { roles } from "../properties";

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

export const rolesCollection = buildCollection({
    path: "roles",
    customId: roles,
    name: "Roles",
    singularName: "Role",
    exportable: false,
    properties: {
        hasRole: {
            name: "Has role",
            description: "User has this role",
            dataType: "boolean"
        }
    },
    callbacks: roleCallbacks
});
