
import {
    buildCollection,
    EntityCollection,
    EntityCustomView
} from "firecms";
import { SkillThemeType } from "beautiful-skill-tree";
import { DocumentReference } from "firebase/firestore";
import { skilltreesCollection } from "./skilltree_collection";
import { SkillTreeEntityViewer } from "../custom_entity_views/SkillTreeEntityViewer";

export type IComposition = {
    id?: string;
    title: string;
    owner?: DocumentReference,
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
    const subcollections = simple ? [] :[
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
            // theme: buildProperty({
            //     name: "Theme",
            //     dataType: "map",
            //     properties: {
            //         backgroundColor: {
            //             name: "Background color",
            //             dataType: "string"
            //         },
            //         border: {
            //             name: "Border",
            //             dataType: "string"
            //         },
            //         borderRadius: {
            //             name: "Border radius",
            //             dataType: "string"
            //         }
            //     },
            //     hideFromCollection: simple
            // }),
            // hasBackgroundImage: {
            //     name: "Has background",
            //     dataType: "boolean",
            //     columnWidth: 200
            // },
            // backgroundImage: ({ values}) => buildProperty({ // The `buildProperty` method is a utility function used for type checking
            //     name: "Background",
            //     dataType: "string",
            //     storage: {
            //         storagePath: "images",
            //         acceptedFiles: ["image/*"]
            //     },
            //     disabled: !values.hasBackgroundImage && {
            //         clearOnDisabled: false,
            //         disabledMessage: "You can only set the background image when you enable it"
            //     },
            //     hideFromCollection: simple
            // }),
            // thumbnailImage: buildProperty({ // The `buildProperty` method is a utility function used for type checking
            //     name: "Thumbnail",
            //     dataType: "string",
            //     storage: {
            //         storagePath: "images",
            //         acceptedFiles: ["image/*"]
            //     },
            //     hideFromCollection: simple
            // }),
            // skillcount: {
            //     name: "Skills",
            //     dataType: "number",
            //     hideFromCollection: simple
            // },
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
            lastUpdate: {
                name: "Last update",
                dataType: "date",
                readOnly: true
            }
        }
    });
}

export const compositionsCollection = buildCompositionsCollection(false);
export const simpleCompositionsCollection = buildCompositionsCollection(true);
