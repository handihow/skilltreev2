import { EntityCollection, buildCollection, buildProperties, buildProperty } from "firecms";
import { IOrganization } from "../types/iorganization.type";

export function buildOrganizationCollection(canView: boolean): EntityCollection<IOrganization> {
    let properties = buildProperties<any>({
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
        }
    })

    if (canView) {
        properties.contacts = buildProperty({
            name: "Contacts",
            dataType: "array",
            of: {
                dataType: "reference",
                path: "users",
                previewProperties: ["displayName", "email"],
            },
            expanded: false
        });
        properties.createdAt = buildProperty({
            dataType: "date",
            name: "Created at",
            autoValue: "on_create",
            disabled: {
                hidden: true
            }
        });
        properties.updatedAt = buildProperty({
            dataType: "date",
            name: "Updated at",
            autoValue: "on_update",
            disabled: {
                hidden: true
            }
        })
    }

    return buildCollection<IOrganization>({
        name: "Organizations",
        description: "Manage organizations",
        singularName: "Organization",
        path: "organizations",
        group: "Administration",
        icon: "CorporateFare",
        defaultSize: "s",
        hideFromNavigation: !canView,
        hideIdFromCollection: true,
        hideIdFromForm: true,
        permissions: ({ authController }) => ({
            edit: authController.extra?.permissions.organizations.edit,
            create: authController.extra?.permissions.organizations.create,
            delete: authController.extra?.permissions.organizations.delete
        }),
        properties
    })
};