import { buildProperty } from "firecms";

export const roles = {
    "instructor": "Instructor",
    "student": "Student",
    "admin": "Admin",
    "super": "Super Admin"
};

export const collections : { [char: string]: string } = {
    "compositions": "SkillTrees",
    "comments": "Comments",
    "evaluations": "Grades",
    "evaluation_models": "Evaluation models",
    "events": "Events",
    "organizations": "Organizations",
    "permissions": "Permissions",
    "share_requests": "Share requests",
    "users": "Users",
}

export const metaData =
    buildProperty({
        name: "Metadata",
        dataType: "map",
        expanded: false,
        readOnly: true,
        properties:
        {
            createdAt: {
                dataType: "date",
                name: "Created at",
                autoValue: "on_create",
            },
            createdBy: {
                name: "Created by",
                dataType: "reference",
                path: "users",
                previewProperties: ["displayName", "email"],
            },
            updatedAt: {
                dataType: "date",
                name: "Updated at",
                autoValue: "on_update",
            },
            updatedBy: {
                name: "Updated by",
                dataType: "reference",
                path: "users",
                previewProperties: ["displayName", "email"],
            },
            status: {
                name: "Status",
                dataType: "string",
                enumValues: [
                    {
                        id: "draft",
                        label: "Draft"
                    },
                    {
                        id: "review",
                        label: "Review"
                    },
                    {
                        id: "publish",
                        label: "Publish"
                    },
                    {
                        id: "expired",
                        label: "Expired"
                    }
                ]
            }
        }
    });

export const title = buildProperty({
    name: "Title",
    validation: { required: true },
    dataType: "string"
});

export const links = buildProperty({
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
});

export const order = {
    name: "Order",
    dataType: "number",
    readOnly: true
}

//references

export const evaluationModel = buildProperty({
    name: "Evaluation model",
    description: "Grade skills with the selected evaluation model",
    dataType: "reference",
    path: "evaluation_models",
    previewProperties: ["name", "type"],
});

export const composition = {
    name: "Composition",
    dataType: "reference",
    path: "compositions",
    previewProperties: ["title"],
    readOnly: true
}

export const skill = {
    name: "Skill",
    dataType: "reference",
    path: "skills",
    previewProperties: ["title"],
    readOnly: true
}

export const student = {
    name: "Student",
    dataType: "reference",
    path: "users",
    previewProperties: ["displayName", "email"],
    readOnly: true
}

export const teacher = {
    name: "Teacher",
    dataType: "reference",
    path: "users",
    previewProperties: ["displayName", "email"],
    readOnly: true
}