import { buildCollection, buildProperty } from "firecms";
import { IOrganization } from "../types/iorganization.type";

export const organizationCollection = buildCollection<IOrganization>({
    name: "Organizations",
    description: "Manage organizations",
    singularName: "Organization",
    path: "organizations",
    group: "Administration",
    icon: "CorporateFare",
    defaultSize: "s",
    hideIdFromCollection: true,
    hideIdFromForm: true,
    permissions: ({ authController }) => ({
        edit: authController.extra?.roles.includes("admin"),
        create: authController.extra?.roles.includes("admin"),
        // we have created the roles object in the navigation builder
        delete: authController.extra?.roles.includes("super")
    }),
    properties: {
        name: {
            name: "Name",
            validation: { required: true },
            dataType: "string"
        },
        address: {
            name: "Address",
            validation: { required: true },
            dataType: "string"
        },
        postalCode: {
            name: "Postal code",
            validation: { required: true },
            dataType: "string"
        },
        city: {
            name: "City",
            validation: { required: true },
            dataType: "string"
        },
        country: {
            name: "Country",
            validation: { required: true },
            dataType: "string"
        },
        contacts: buildProperty({
            name: "Contacts",
            dataType: "array",
            of: {
                dataType: "reference",
                path: "users",
                previewProperties: ["displayName", "email"],
            },
            expanded: false
        }),
        createdAt: buildProperty({
            dataType: "date",
            name: "Created at",
            autoValue: "on_create",
            disabled: {
                hidden: true
            }
        }),
        updatedAt: buildProperty({
            dataType: "date",
            name: "Updated at",
            autoValue: "on_update",
            disabled: {
                hidden: true
            }
        })
    }
});