import { buildCollection, buildProperties, buildProperty } from "firecms";
import { collections, roles } from "./properties";

const permissionProperty = buildProperty({
    dataType: "map",
    properties: {
        view: {
            name: "View",
            dataType: "boolean",
            defaultValue: false,
        },
        create: {
            name: "Create",
            dataType: "boolean",
            defaultValue: false,
        },
        edit: {
            name: "Edit",
            dataType: "boolean",
            defaultValue: false,
        },
        delete: {
            name: "Delete",
            dataType: "boolean",
            defaultValue: false,
        }
    }
});
let properties = buildProperties<any>({});

Object.keys(collections).forEach(key => {
    properties[key] = {name: collections[key], ...permissionProperty};
})

export const permissionsCollection = buildCollection({
    path: "permissions",
    customId: roles,
    name: "Permissions",
    description: "Manage permissions",
    singularName: "Permission",
    group: "Administration",
    defaultSize: "l",
    properties,
    exportable: false,
    icon: "Security",
    permissions: ({ authController }) => ({
        view: authController.extra?.permissions.permissions.view,
        edit: authController.extra?.permissions.permissions.edit,
        create: authController.extra?.permissions.permissions.create,
        // we have created the roles object in the navigation builder
        delete: authController.extra?.permissions.permissions.delete
    }),
});