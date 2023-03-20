import {
    buildProperty, buildCollection, EntityCollection, buildEntityCallbacks, EntityOnDeleteProps,
} from "firecms";
import CustomHTMLPreview from "../custom_field_preview/HTMLPreview";
import { deleteFromPathRecursively, getCountFromPath } from "../services/firestore";
import { MoveDownAction, MoveUpAction } from "../actions/move.actions";
import { ISkill } from "../types/iskill.type";


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
        const collectionPath = path + "/" + entityId + "/skills"
        const error = await deleteFromPathRecursively(collectionPath, "Skill")
        if(error) throw new Error(error);
        // if(entity.values.countChildren && entity.values.countChildren > 0) throw new Error("This skill has children. Delete the child skills first");
    },
});

function skillsCollectionBuilder(level: number, hasSubcollections: boolean, description: string | undefined): EntityCollection<ISkill> {
    let subcollections: EntityCollection<ISkill>[] | undefined;
    if (level < 10 && hasSubcollections) {
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
        defaultSize: "s",
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
                dataType: "string",
                enumValues: [
                    {
                        id: "default",
                        label: "Set by parent"
                    },
                    {
                        id: "not_graded",
                        label: "Do not grade"
                    },
                    {
                        id: "graded",
                        label: "Graded skill"
                    }
                ]
            },
            createdAt: buildProperty({
                dataType: "date",
                name: "Created at",
                autoValue: "on_create",
                readOnly: true
            }),
            updatedAt: buildProperty({
                dataType: "date",
                name: "Updated at",
                autoValue: "on_update",
                readOnly: true
            })
        },
        callbacks: skillCallbacks
    });
}

export const skillsCollection = skillsCollectionBuilder(0, false, "Manage all skills");
export const skillsCollectionWithSubcollections = skillsCollectionBuilder(0, true, undefined);