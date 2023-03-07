
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
import { updateSharedUserStatus } from "../services/firestore";
import { ViewSkillTreeAction } from "../actions/viewST.actions";

export type IComposition = {
    id?: string;
    title: string;
    // owner?: EntityReference;
    user?: string; //refers to user uid
    username?: string; //refers to user email
    theme?: SkillThemeType;
    backgroundImage?: string;
    loggedInUsersOnly?: boolean;
    loggedInUsersCanEdit?: boolean;
    canCopy?: boolean;
    sharedUsers?: string[];
    // sharedWith?: EntityReference[];
    lastUpdate?: any;
    url?: string;
    evaluationModel?: any;
}

const compositionCallbacks = buildEntityCallbacks({
    onPreSave: ({
        entityId,
        values,
        status
    }) => {
        // return the updated values
        console.log(status);
        values.user = values.user.id;
        if(values.sharedUsers) {
            values.sharedUsers = values.sharedUsers.map((su: EntityReference) => su.id);
            updateSharedUserStatus(values.sharedUsers, values.id, status);
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
        group: "Content",
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
                    forceFilter: organization ? { organization: ["==", organization] } : undefined
                },
                expanded: false
            }),
            loggedInUsersOnly: {
                name: "Logged in only",
                dataType: "boolean",
                columnWidth: 200
            },
            loggedInUsersCanEdit: {
                name: "Logged in can edit",
                dataType: "boolean",
                columnWidth: 200
            },
            canCopy: {
                name: "Can copy",
                dataType: "boolean",
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
                description: "Grade skills. Optional skills are not grades by default.",
                dataType: "reference",
                path: "evaluation_models",
                previewProperties: ["name", "type"],
            }),
            lastUpdate: {
                name: "Last update",
                dataType: "date",
                readOnly: true,
                autoValue: "on_update"
            }
        },
        callbacks: compositionCallbacks
    });
}

export const compositionsCollection = buildCompositionsCollection(false);
export const simpleCompositionsCollection = buildCompositionsCollection(true);
