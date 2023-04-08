import {
    buildCollection, EntityCollection, EntityReference,
} from "firecms";
import { IUser } from "../../types/iuser.type";
import { UserSchedulerView } from "../../custom_entity_view/scheduler";
import { UserEvaluationsView } from "../../custom_entity_view/userEvals";
import { rolesCollection } from "./role_collection";

export function buildUsersCollection(view: "admin" | "teacher" | "record", organization?: string, compositionId?: string): EntityCollection<IUser> {

    return buildCollection<IUser>({
        name: "Users",
        description: "Manage all users",
        singularName: "User",
        path: "users",
        group: "Administration",
        defaultSize: "s",
        alias: compositionId ? compositionId : undefined,
        subcollections: view === "admin" ? [
            rolesCollection
        ] : [],
        icon: "Group",
        inlineEditing: false,
        hideIdFromCollection: view === "admin" && !organization,
        hideIdFromForm: view === "admin" && !organization,
        permissions: ({ authController }) => ({
            edit: view !== "teacher",
            create: authController.extra?.roles.includes("admin") || authController.extra?.roles.includes("super"),
            // we have created the roles object in the navigation builder
            delete: authController.extra?.roles.includes("super")
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
            organizations: {
                name: "Organizations",
                dataType: "array",
                of: {
                    dataType: "reference",
                    path: "organizations",
                    previewProperties: ["name"]
                }
            }
        },
    })
};