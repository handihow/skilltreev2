
import {
    buildCollection,
    buildProperty,
    EntityCollection,
    EntityCustomView,
} from "firecms";
import { SkillThemeType } from "beautiful-skill-tree";
import { skilltreesCollection } from "./skilltree_collection";
import { SkillTreeEntityViewer } from "../custom_entity_views/SkillTreeEntityViewer";
import { colors, gradients} from "../common/StandardData";
import { getLoadedFonts } from "../services/fonts";

export type IComposition = {
    id?: string;
    title: string;
    user?: string; //refers to user uid
    username?: string; //refers to user email
    theme?: SkillThemeType;
    hasBackgroundImage?: boolean;
    backgroundImage?: string;
    thumbnailImage?: string;
    skillcount?: number;
    loggedInUsersOnly?: boolean;
    loggedInUsersCanEdit?: boolean;
    canCopy?: boolean;
    sharedUsers?: string[];
    lastUpdate?: any;
    url?: string;
}

const skillTreeViewer: EntityCustomView = {
    path: "viewer",
    name: "SkillTree viewer",
    builder: (props) => <SkillTreeEntityViewer {...props}/>
};

function buildCompositionsCollection(simple: boolean): EntityCollection<IComposition> {
    const fonts = getLoadedFonts();
    const subcollections = simple ? [] : [
        skilltreesCollection,
    ];
    return buildCollection<IComposition>({
        name: "Compositions",
        description: "Manage all compositions",
        singularName: "Composition",
        path: "compositions",
        group: "Content",
        views: simple ? [] : [
            skillTreeViewer
        ],
        permissions: ({ authController }) => ({
            edit: simple || authController.extra?.includes("super"),
            create: simple || authController.extra?.includes("super"),
            // we have created the roles object in the navigation builder
            delete: simple || authController.extra?.includes("super")
        }),
        subcollections,
        icon: "AccountTree",
        properties: {
            title: {
                name: "Title",
                validation: { required: true },
                dataType: "string"
            },
            username: {
                name: "Owner",
                validation: { required: true },
                dataType: "string",
                readOnly: true
            },
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
            hasBackgroundImage: {
                name: "Has background",
                dataType: "boolean",
                columnWidth: 200
            },
            backgroundImage: ({ values}) => buildProperty({ // The `buildProperty` method is a utility function used for type checking
                name: "Background",
                dataType: "string",
                storage: {
                    storagePath: "images",
                    acceptedFiles: ["image/*"]
                },
                disabled: !values.hasBackgroundImage && {
                    clearOnDisabled: false,
                    disabledMessage: "You can only set the background image when you enable it"
                },
                hideFromCollection: !simple
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
            lastUpdate: {
                name: "Last update",
                dataType: "date",
                readOnly: true,
                autoValue: "on_update"
            }
        }
    });
}

export const compositionsCollection = buildCompositionsCollection(false);
export const simpleCompositionsCollection = buildCompositionsCollection(true);
