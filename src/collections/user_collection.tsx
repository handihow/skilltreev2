import {
    buildCollection, buildEntityCallbacks, EntityCollection, EntityReference,
} from "firecms";
import { IUser } from "../types/iuser.type";
import { UserSchedulerView } from "../custom_entity_view/scheduler";
import { UserEvaluationsView } from "../custom_entity_view/userEvals";

const roleCallbacks = buildEntityCallbacks({
    onPreSave: ({
        entityId,
        values,
        status,
        context
    }) => {
        const canAssignAdminRole = context.authController.extra?.roles.includes("admin");
        if (status === "new" && entityId === "admin" && !canAssignAdminRole)
            throw Error("Only admins can assign the admin role. Please contact support if you require admin rights.");
        return values;
    }
});

const roles = {
    "student": "Student",
    "instructor": "Instructor",
    "admin": "Admin",
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
    },
    callbacks: roleCallbacks
});


export function buildUsersCollection(view: "admin" | "teacher" | "record", organization?: string, compositionId?: string): EntityCollection<IUser> {

    return buildCollection<IUser>({
        name: "Users",
        description: "Manage all users",
        singularName: "User",
        path: "users",
        group: "Administration",
        defaultSize: "s",
        subcollections: view === "admin" ? [
            rolesCollection
        ] : [],
        icon: "AccountCircle",
        inlineEditing: false,
        permissions: ({ authController }) => ({
            edit: view !== "teacher",
            create: false,
            // we have created the roles object in the navigation builder
            delete: false
        }),
        views: [
            {
                path: "evaluations",
                name: "Grades",
                builder: ({ entity }) =>
                    <UserEvaluationsView entity={entity} compositionId={compositionId} />
            },
            {
                path: "schedule",
                name: "Schedule",
                builder: ({ entity }) =>
                    <UserSchedulerView entity={entity} compositionId={compositionId} />
            }
        ],
        forceFilter: organization ? { organizations: ["array-contains", new EntityReference(organization, "organizations")] } : undefined,
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
        // callbacks: userCallbacks
    })
};