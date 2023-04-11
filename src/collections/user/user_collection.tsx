import {
    buildCollection, EntityCollection, EntityReference,
} from "firecms";
import { IUser } from "../../types/iuser.type";
import { UserSchedulerView } from "../../custom_entity_view/scheduler";
import { UserEvaluationsView } from "../../custom_entity_view/userEvals";
import { rolesCollection } from "./role_collection";

export function buildUsersCollection(view: "admin" | "teacher", organization?: string, compositionId?: string): EntityCollection<IUser> {

    return buildCollection<IUser>({
        name: "Users",
        description: "Manage all users",
        singularName: "User",
        path: "users",
        group: "Administration",
        defaultSize: "s",
        alias: compositionId ? compositionId : undefined,
        subcollections: [rolesCollection],
        icon: "Group",
        inlineEditing: false,
        hideIdFromCollection: true,
        hideIdFromForm: true,
        permissions: ({ authController }) => ({
            edit: authController.extra?.permissions.users.edit,
            create: authController.extra?.permissions.users.create,
            // we have created the roles object in the navigation builder
            delete: authController.extra?.permissions.users.delete
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

export const editRecordCollection = buildCollection<IUser>({
    name: "Your record",
    description: "Manage your user record",
    singularName: "Your record",
    path: "users",
    alias: "your-record",
    hideIdFromForm: true,
    subcollections: [rolesCollection],
    properties: {
        email: {
            name: "Email",
            email: true,
            disabled: true,
            dataType: "string",
            
        },
        displayName: {
            name: "Display name",
            dataType: "string"
        },
        organizations: {
            name: "Organizations",
            dataType: "array",
            description: "Your primary organization must be on the first place!",
            longDescription: "Add yourself to an organization to make it easier to share SkillTrees",
            of: {
                dataType: "reference",
                path: "organizations",
                previewProperties: ["name", "city"]
            }
        }
    }
});