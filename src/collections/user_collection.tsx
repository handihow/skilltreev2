import {
    buildCollection,
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

type IUser = {
    email: string;
    displayName: string;
    photoURL?: string;
    emailVerified: boolean;
    standardFeedback?: string;
    hostedDomain?: string;
    provider?: string;
    creationTime?: any;
    lastSignInTime?: any;
    type?: string;
    organisation?: string;
    subjects?: string;
    groups?: string;
    programs?: string;
}


export const usersCollection = buildCollection<IUser>({
    name: "Users",
    description: "Manage all users",
    singularName: "User",
    path: "users",
    group: "Administration",
    subcollections: [
        rolesCollection
    ],
    icon: "AccountCircle",
    permissions: ({ authController }) => ({
        edit: true,
        create: false,
        // we have created the roles object in the navigation builder
        delete: false
    }),
    properties: {
        email: {
            name: "Email",
            validation: { required: true },
            dataType: "string"
        },
        displayName: {
            name: "Display name",
            validation: { required: true },
            dataType: "string"
        },
        emailVerified: {
            name: "Email verified",
            dataType: "boolean"
        },
        hostedDomain: {
            name: "Domain",
            dataType: "string"
        },
        provider: {
            name: "Provider",
            dataType: "string"
        },
        creationTime: {
            name: "Created",
            dataType: "string"
        },
        lastSignInTime: {
            name: "Last sign-in",
            dataType: "string"
        },
        type: {
            name: "Type",
            dataType: "string"
        },
        organisation: {
            name: "Organization",
            dataType: "string"
        },
        subjects: {
            dataType: "array",
            name: "Subjects",
            of: {
                dataType: "string",
                previewAsTag: true
            },
            expanded: true
        }
    }
});