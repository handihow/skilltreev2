import { buildCollection, buildEntityCallbacks, buildProperty, EntityReference } from "firecms";

type IOrganization = {
    name: string;
    address: string;
    postalCode: string;
    city: string;
    country: string;
    contacts?: any[];
}

export const organizationCollection = buildCollection<IOrganization>({
    name: "Organizations",
    description: "Manage organizations",
    singularName: "Organization",
    path: "organizations",
    group: "Administration",
    icon: "CorporateFare",
    permissions: ({ authController }) => ({
        edit: true,
        create: true,
        // we have created the roles object in the navigation builder
        delete: true
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
    }
});