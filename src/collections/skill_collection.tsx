import {
    buildProperty, buildCollection, EntityCollection, buildEntityCallbacks,
} from "firecms";
import CustomHTMLPreview from "../custom_field_preview/HTMLPreview";
import { IconPrefix, IconName } from '@fortawesome/fontawesome-svg-core';

type ILink = {
    id: string;
    iconName: IconName;
    iconPrefix: IconPrefix;
    reference: string;
    title: string;
    description?: string;
    imageUrl?: string;
    filename?: string;
}

export type ISkill = {
    id?: string;
    composition?: string;        //references the composition ID
    skilltree?: string;          //references the skilltree ID
    title: string;
    description?: string;
    icon?: string;
    links?: ILink[];
    order?: number;
    optional: boolean;
    direction?: string;
    countChildren?: number;
    category?: string;
    reference?: string;
    //properties to track the parent and path
    parent?: any;
    path?: string;
    hierarchy?: number;
    //properties to assist in loading into skilltree
    tooltip?: any;
    children?: ISkill[];
    //properties to assist in loading into treebeard
    name?: string;
    isSkill?: boolean;
    decorators?: any;
    toggled?: boolean;
    //properties to assist in loading into skills table
    compositionTitle?: string;
    table?: string;
}


const skillCallbacks = buildEntityCallbacks({
    onPreSave: ({
        collection,
        path,
        entityId,
        values,
        status
    }) => {
        // return the updated values
        if (values.links && values.links.length > 0) {
            values.links = values.links.map((l: any) => {
                return { id: Math.floor(Math.random() * 10000), iconName: "link", iconPrefix: "fas", ...l }
            })
        }
        return values;
    },
});

function skillsCollectionBuilder(level: number, hasSubcollections: boolean, description: string | undefined): EntityCollection<ISkill> {
    let subcollections: EntityCollection<ISkill>[] | undefined;
    if (level < 5 && hasSubcollections) {
        subcollections = [skillsCollectionBuilder(level + 1, true, undefined)];
    }
    return buildCollection<ISkill>({
        name: "Skills",
        description,
        singularName: "Skill",
        path: "skills",
        group: "Content",
        subcollections,
        initialSort: hasSubcollections ? ["order", "asc"] : undefined,
        icon: "FormatListBulleted",
        permissions: ({ authController }) => {
            const isAdmin = authController.extra?.includes("admin") || authController.extra?.includes("super");
            return ({
                edit: isAdmin,
                create: false,
                // we have created the roles object in the navigation builder
                delete: false
            })
        },
        properties: {
            title: {
                name: "Title",
                validation: { required: true },
                dataType: "string"
            },
            description: {
                name: "Description",
                dataType: "string",
                multiline: true,
                Preview: CustomHTMLPreview
            },
            optional: {
                name: "Optional",
                dataType: "boolean"
            },
            // icon: {
            //     name: "Icon",
            //     dataType: "string",
            //     storage: {
            //         storagePath: "images",
            //         acceptedFiles: ["image/*"]
            //     },
            // },
            links: buildProperty({
                name: "Links",
                dataType: "array",
                of: buildProperty({
                    dataType: "map",
                    properties: {
                        title: {
                            name: "Title",
                            dataType: "string"
                        },
                        reference: {
                            name: "Link url",
                            dataType: "string",
                            url: true
                        }
                    }
                }),
                expanded: true
            }),
            order: {
                name: "Order",
                dataType: "number",
                readOnly: true
            },
            countChildren: {
                name: "Child skills",
                dataType: "number",
                readOnly: true
            }
        },
        callbacks: skillCallbacks
    });
}

export const skillsCollection = skillsCollectionBuilder(0, false, "Manage all skills");
export const skillsCollectionWithSubcollections = skillsCollectionBuilder(0, true, undefined);