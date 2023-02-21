import { buildCollection } from "firecms";

type IOrganization = {
    name: string;
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
        }
    }
});