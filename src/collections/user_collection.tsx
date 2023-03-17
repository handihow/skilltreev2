import {
    buildCollection, buildEntityCallbacks, EntityCollection, EntityOnFetchProps, EntityReference,
} from "firecms";

const roles = {
    "student": "Student",
    "instructor": "Instructor",
    "admin": "Admin",
    "super": "Super Admin"
};

const rolesCollection = buildCollection({
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
    }
});

export type IUser = {
    uid?: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    emailVerified: boolean;
    standardFeedback?: string;
    hostedDomain?: string;
    provider?: string;
    creationTime?: any;
    lastSignInTime?: any;
    type?: string;
    organizations?: string[];
    subjects?: string;
    groups?: string;
    programs?: string;
}


const userCallbacks = buildEntityCallbacks({
    onPreSave: ({
        values,
    }) => {
        // return the updated values
        if (values.organizations) {
            values.organizations = values.organizations.map((o: { id: any; }) => o.id);
        }
        return values;
    },

    onFetch({
        entity,
    }: EntityOnFetchProps) {
        if (entity.values.organizations) {
            entity.values.organizations = entity.values.organizations.map((o: string) => new EntityReference(o, "organizations"));
        }
        return entity;
    },
});

export function buildUsersCollection(organization?: string): EntityCollection<IUser> {
    return buildCollection<IUser>({
        name: "Users",
        description: "Manage all users",
        singularName: "User",
        path: "users",
        group: "Administration",
        defaultSize: "s",
        subcollections: [
            rolesCollection
        ],
        icon: "AccountCircle",
        inlineEditing: false,
        permissions: ({ authController }) => ({
            edit: authController.extra?.roles?.includes("super"),
            create: false,
            // we have created the roles object in the navigation builder
            delete: false
        }),
        forceFilter: organization ? { organizations: ["array-contains", organization] } : undefined,
        properties: {
            email: {
                name: "Email",
                validation: { required: true },
                dataType: "string",
            },
            displayName: {
                name: "Display name",
                dataType: "string"
            },
            emailVerified: {
                name: "Email verified",
                dataType: "boolean",
                readOnly: true
            },
            // hostedDomain: {
            //     name: "Domain",
            //     dataType: "string"
            // },
            provider: {
                name: "Provider",
                dataType: "string",
                readOnly: true
            },
            creationTime: {
                name: "Created",
                dataType: "string",
                readOnly: true
            },
            lastSignInTime: {
                name: "Last sign-in",
                dataType: "string",
                readOnly: true
            },
            // type: {
            //     name: "Type",
            //     dataType: "string"
            // },
            organizations: {
                name: "Organizations",
                dataType: "array",
                of: {
                    dataType: "reference",
                    path: "organizations",
                    previewProperties: ["name"]
                }
            },
            // subjects: {
            //     dataType: "array",
            //     name: "Subjects",
            //     of: {
            //         dataType: "string",
            //         previewAsTag: true
            //     },
            //     expanded: true
            // }
        },
        callbacks: userCallbacks
    })
};