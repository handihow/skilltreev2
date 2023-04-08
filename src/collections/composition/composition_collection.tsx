
import {
    buildCollection,
    buildProperties,
    EntityCollection,
} from "firecms";
import { buildSkilltreesCollection } from "../skilltree_collection";
import { ViewSkillTreeAction } from "../../actions/viewST.actions";
import { IComposition } from "../../types/icomposition.type";
import { compositionCallbacks } from "./callbacks";
import { evaluationModel, title } from "../properties";
import {
    user,
    sharedUsers,
    canCopy,
    loggedInUsersCanEdit,
    requireShareApproval,
    backgroundImage,
    theme,
    gradeAllSkillsByDefault,
    lastUpdate,
    createdAt
} from "./properties";

export function buildAdminCompositionsCollection(organization?: string): EntityCollection<IComposition> {
    return buildCollection<IComposition>({
        name: "SkillTrees",
        description: "Manage all SkillTrees",
        singularName: "SkillTree",
        path: "compositions",
        alias: "admin-compositions",
        group: "Administration",
        icon: "AccountTree",
        properties: {
            title,
            user,
            sharedUsers: sharedUsers(organization),
            canCopy,
            loggedInUsersCanEdit,
            requireShareApproval,
            backgroundImage,
            theme: theme(false),
            evaluationModel,
            gradeAllSkillsByDefault,
            lastUpdate,
            createdAt
        },
        defaultSize: "xs",
        Actions: [ViewSkillTreeAction],
        inlineEditing: true,
        exportable: false,
        hideIdFromCollection: organization ? true : false,
        hideIdFromForm: organization ? true : false,
        subcollections: [buildSkilltreesCollection(true)],
        callbacks: compositionCallbacks
    })
}

export function buildTeacherCompositionsCollection(simple: boolean, organization?: string): EntityCollection<IComposition> {
    const subcollections = simple ? [] : [
        buildSkilltreesCollection(true),
    ];
    let properties = buildProperties<any>({
        title,
    })
    if (organization) properties.sharedUsers = sharedUsers(organization);
    if (!simple) {
        properties.canCopy = canCopy;
        properties.loggedInUsersCanEdit = loggedInUsersCanEdit;
        properties.requireShareApproval = requireShareApproval;
    }
    properties.backgroundImage = backgroundImage;
    properties.theme = theme(simple);
    properties.evaluationModel = evaluationModel;
    properties.gradeAllSkillsByDefault = gradeAllSkillsByDefault;
    properties.lastUpdate = lastUpdate;
    properties.createdAt = createdAt;

    return buildCollection<IComposition>({
        name: "SkillTrees",
        description: "Manage all SkillTrees",
        singularName: "SkillTree",
        path: "compositions",
        group: "Administration",
        alias: simple ? "edit-composition" : undefined,
        defaultSize: "s",
        hideIdFromCollection: true,
        hideIdFromForm: true,
        exportable: false,
        Actions: [ViewSkillTreeAction],
        inlineEditing: false,
        permissions: ({ authController }) => ({
            edit: true,
            create: false,
            // we have created the roles object in the navigation builder
            delete: authController.extra?.roles.includes("super")
        }),
        subcollections,
        icon: "AccountTree",
        properties,
        callbacks: compositionCallbacks
    });
}

