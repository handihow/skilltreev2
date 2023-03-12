import {
    buildProperty, buildCollection, EntityCollection, buildEntityCallbacks, EntityOnDeleteProps,
} from "firecms";
import CustomHTMLPreview from "../custom_field_preview/HTMLPreview";
import { IconPrefix, IconName } from '@fortawesome/fontawesome-svg-core';
import { deleteFromPathRecursively, getCountFromPath } from "../services/firestore";
import { MoveDownAction, MoveUpAction } from "../actions/move.actions";

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
    image?: string;
    links?: ILink[];
    order?: number;
    optional: boolean;
    direction?: string;
    countChildren?: number;
    category?: string;
    reference?: string;
    //properties to track the parent and path
    parent?: string[];
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
    gradeSkill?: boolean;
}


const skillCallbacks = buildEntityCallbacks({
    onPreSave: async ({
        path,
        values,
        entityId,
        status
    }) => {
        // return the updated values
        if (values.links && values.links.length > 0) {
            values.links = values.links.map((link: any) => {
                return { id: Math.floor(Math.random() * 10000), iconName: "link", iconPrefix: "fas", ...link }
            })
        }
        if(status !== "existing") {
            const split = path.split("/");
            values.composition = split.length ? split[1] : "";
            values.skilltree = split.length ? split[3] : "";
            values.order = await getCountFromPath(path);
            values.id = entityId;
        }
        return values;
    },
    onPreDelete: async ({
        path,
        entityId,
        entity
    }: EntityOnDeleteProps<ISkill>
    ) => {
        console.log(path);
        const collectionPath = path + "/" + entityId + "/skills"
        const error = await deleteFromPathRecursively(collectionPath, "Skill")
        if(error) throw new Error(error);
        // if(entity.values.countChildren && entity.values.countChildren > 0) throw new Error("This skill has children. Delete the child skills first");
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
        inlineEditing: false,
        permissions: ({ authController }) => {
            const isStudent = authController.extra?.roles.includes("student");
            return ({
                edit: !isStudent,
                create: !isStudent,
                // we have created the roles object in the navigation builder
                delete: !isStudent
            })
        },
        Actions: [MoveDownAction, MoveUpAction],
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
            image: {
                name: "Image",
                dataType: "string",
                storage: {
                    storagePath: "images",
                    acceptedFiles: ["image/*"]
                },
            },
            links: buildProperty({
                name: "Links",
                dataType: "array",
                of: buildProperty({
                    dataType: "map",
                    properties: {
                        title: {
                            name: "Title",
                            dataType: "string",
                            validation: {
                                required: true,
                                requiredMessage: "Title is required"
                            }
                        },
                        reference: {
                            name: "Link url",
                            dataType: "string",
                            url: true,
                            validation: {
                                required: true,
                                requiredMessage: "Link is required"
                            }
                        }
                    }
                }),
                expanded: false
            }),
            order: {
                name: "Order",
                dataType: "number",
                readOnly: true
            },
            gradeSkill: {
                name: "Graded skill",
                dataType: "boolean",
            }
        },
        callbacks: skillCallbacks
    });
}

export const skillsCollection = skillsCollectionBuilder(0, false, "Manage all skills");
export const skillsCollectionWithSubcollections = skillsCollectionBuilder(0, true, undefined);