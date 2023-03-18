
import {
    buildCollection,
    buildEntityCallbacks,
    buildProperty,
    EntityCollection,
    EntityOnFetchProps,
    EntityReference,
} from "firecms";
import { SkillThemeType } from "beautiful-skill-tree";
import { skilltreesCollection } from "./skilltree_collection";
import { colors, gradients } from "../common/StandardData";
import { getLoadedFonts } from "../services/fonts";
import { ViewSkillTreeAction } from "../actions/viewST.actions";
import { updateSharedUserStatus } from "../services/user.service";

export type IComposition = {
    id?: string;
    title: string;
    // owner?: EntityReference;
    user?: string; //refers to user uid
    username?: string; //refers to user email
    theme?: SkillThemeType;
    backgroundImage?: string;
    // loggedInUsersOnly?: boolean;
    loggedInUsersCanEdit?: boolean;
    canCopy?: boolean;
    requireShareApproval?: boolean;
    sharedUsers?: string[];
    pendingApprovalUsers?: string[];
    // sharedWith?: EntityReference[];
    lastUpdate?: any;
    url?: string;
    evaluationModel?: any;
    gradeAllSkillsByDefault?: boolean;
    pendingApproval?: boolean;
    createdAt?: Date;
}

const compositionCallbacks = buildEntityCallbacks({
    onPreSave: ({
        entityId,
        values,
        status
    }) => {
        // return the updated values
        values.user = values.user.id;
        if(values.sharedUsers) {
            values.sharedUsers = values.sharedUsers.map((su: EntityReference) => su.id);
            updateSharedUserStatus(values.sharedUsers, values.id, status);
        }
        if(values.pendingApprovalUsers) {
            values.pendingApprovalUsers = values.pendingApprovalUsers.map((su: EntityReference) => su.id);
        }
        if(status !== "existing") {
            values.id = entityId;
        }
        return values;
    },
    
    onFetch({
        entity,
    }: EntityOnFetchProps) {
        entity.values.user = new EntityReference(entity.values.user, "users");
        if(entity.values.sharedUsers) {
            entity.values.sharedUsers = entity.values.sharedUsers.map((su: string) => new EntityReference(su, "users"))
        }
        if(entity.values.pendingApprovalUsers) {
            entity.values.pendingApprovalUsers = entity.values.pendingApprovalUsers.map((su: string) => new EntityReference(su, "users"))
        }
        return entity;
    },
});

export function buildCompositionsCollection(simple: boolean, organization?: string): EntityCollection<IComposition> {
    const fonts = getLoadedFonts();
    const subcollections = simple ? [] : [
        skilltreesCollection,
    ];
    return buildCollection<IComposition>({
        name: "SkillTrees",
        description: "Manage all SkillTrees",
        singularName: "SkillTree",
        path: "compositions",
        group: "Administration",
        defaultSize: "s",
        // views: simple ? [] : [skillTreeViewer],
        Actions: [ViewSkillTreeAction],
        inlineEditing: false,
        permissions: ({ authController }) => ({
            edit: true,
            create: false,
            // we have created the roles object in the navigation builder
            delete: false || authController.extra?.roles.includes("super")
        }),
        subcollections,
        icon: "AccountTree",
        properties: {
            title: {
                name: "Title",
                validation: { required: true },
                dataType: "string"
            },
            user: buildProperty({
                name: "Owner",
                dataType: "reference",
                path: "users",
                previewProperties: ["displayName", "email"],
                validation: {required: true},
                readOnly: true
            }),
            sharedUsers: buildProperty({
                name: "Shared with",
                dataType: "array",
                of: {
                    dataType: "reference",
                    path: "users",
                    previewProperties: ["displayName", "email"],
                    forceFilter: organization ? { organizations: ["array-contains", organization] } : undefined
                },
                expanded: false
            }),
            // loggedInUsersOnly: {
            //     name: "Logged in only",
            //     description: "Only logged in users can view the SkillTree",
            //     dataType: "boolean",
            //     defaultValue: true,
            //     columnWidth: 200
            // },
            canCopy: {
                name: "Can copy",
                description: "Users can copy the SkillTree if it is shared",
                dataType: "boolean",
                defaultValue: false,
                columnWidth: 200
            },
            loggedInUsersCanEdit: {
                name: "Can update the completion status",
                description: "Users can update the completion status of skills",
                dataType: "boolean",
                defaultValue: true,
                columnWidth: 200
            },
            requireShareApproval: {
                name: "Authorize share requests",
                description: "Your approval is needed before users can add to shared SkillTrees",
                dataType: "boolean",
                defaultValue: false,
                columnWidth: 200
            },
            backgroundImage: ({ values }) => buildProperty({
                name: "Background",
                dataType: "string",
                storage: {
                    storagePath: "images",
                    acceptedFiles: ["image/*"]
                }
            }),
            theme: buildProperty({
                name: "Theme",
                dataType: "map",
                expanded: false,
                properties: {
                    backgroundColor: {
                        name: "Skilltree background",
                        dataType: "string",
                        enumValues: colors
                    },
                    nodeDesktopTextNodeWidth: {
                        name: "Node desktop width",
                        dataType: "string",
                        enumValues: [
                            {
                                id: "120px",
                                label: "Narrow"
                            },
                            {
                                id: "144px",
                                label: "Normal"
                            },
                            {
                                id: "188px",
                                label: "Wide"
                            },
                            {
                                id: "222px",
                                label: "Very wide"
                            }
                        ]
                    },
                    nodeDesktopTextNodeHeight: {
                        name: "Node desktop height",
                        dataType: "string",
                        enumValues: [
                            {
                                id: "22px",
                                label: "Short"
                            },
                            {
                                id: "28px",
                                label: "Normal"
                            },
                            {
                                id: "36px",
                                label: "Tall"
                            },
                            {
                                id: "48px",
                                label: "Very tall"
                            }
                        ]
                    },
                    nodeDesktopFontSize: {
                        name: "Node font size",
                        dataType: "string",
                        enumValues: [
                            {
                                id: "12px",
                                label: "Small"
                            },
                            {
                                id: "16px",
                                label: "Normal"
                            },
                            {
                                id: "24px",
                                label: "Big"
                            },
                            {
                                id: "32px",
                                label: "Huge"
                            }
                        ]
                    },
                    nodeFontColor: {
                        name: "Node font color",
                        dataType: "string",
                        enumValues: colors
                    },
                    nodeBorderColor: {
                        name: "Node border color",
                        dataType: "string",
                        enumValues: colors
                    },
                    nodeActiveBackgroundColor: {
                        name: "Node active gradient",
                        dataType: "string",
                        enumValues: gradients
                    },
                    nodeHoverBorderColor: {
                        name: "Node hover border gradient",
                        dataType: "string",
                        enumValues: gradients
                    },
                    nodeMobileTextNodeWidth: {
                        name: "Node mobile width",
                        dataType: "string",
                        enumValues: [
                            {
                                id: "92px",
                                label: "Narrow"
                            },
                            {
                                id: "108px",
                                label: "Normal"
                            },
                            {
                                id: "144px",
                                label: "Wide"
                            },
                            {
                                id: "188px",
                                label: "Very wide"
                            }
                        ]
                    },
                    nodeMobileTextNodeHeight: {
                        name: "Node mobile height",
                        dataType: "string",
                        enumValues: [
                            {
                                id: "24px",
                                label: "Short"
                            },
                            {
                                id: "32px",
                                label: "Normal"
                            },
                            {
                                id: "38px",
                                label: "Tall"
                            },
                            {
                                id: "52px",
                                label: "Very tall"
                            }
                        ]
                    },
                    headingFont: {
                        name: "Heading font",
                        dataType: "string",
                        enumValues: fonts
                    },
                    headingFontSize: {
                        name: "Heading font size",
                        dataType: "string",
                        enumValues: [
                            {
                                id: "16px",
                                label: "Small"
                            },
                            {
                                id: "24px",
                                label: "Normal"
                            },
                            {
                                id: "32px",
                                label: "Big"
                            },
                            {
                                id: "48px",
                                label: "Huge"
                            }
                        ]
                    },
                    headingFontColor: {
                        name: "Heading font color",
                        dataType: "string",
                        enumValues: colors
                    },
                    primaryFont: {
                        name: "Node font",
                        dataType: "string",
                        enumValues: fonts
                    }
                },
                hideFromCollection: !simple
            }),
            evaluationModel: buildProperty({
                name: "Evaluation model",
                description: "Grade skills with the selected evaluation model",
                dataType: "reference",
                path: "evaluation_models",
                previewProperties: ["name", "type"],
            }),
            gradeAllSkillsByDefault: ({values}) => {
                return buildProperty({
                    name: "Grade all skills",
                    description: "Grade all skills by default using the selected evaluation model",
                    dataType: "boolean",
                    disabled: !values.evaluationModel
                })
            },
            lastUpdate: {
                name: "Last update",
                dataType: "date",
                readOnly: true,
                autoValue: "on_update"
            },
            createdAt: buildProperty({
                dataType: "date",
                name: "Created at",
                autoValue: "on_create",
                readOnly: true
            })
        },
        callbacks: compositionCallbacks
    });
}

export const compositionsCollection = buildCompositionsCollection(false);
export const simpleCompositionsCollection = buildCompositionsCollection(true);
