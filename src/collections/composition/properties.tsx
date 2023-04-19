import { EntityReference, buildProperty } from "firecms"
import { gradients, colors } from "../../common/StandardData"
import { getLoadedFonts } from "../../services/fonts";
import { IComposition } from "../../types/icomposition.type";

export const user = buildProperty({
    name: "Owner",
    dataType: "reference",
    path: "users",
    previewProperties: ["displayName", "email"],
    readOnly: true
})

export const sharedUsers = (organization?: string) => {
    return buildProperty({
        name: "Shared with",
        dataType: "array",
        of: {
            dataType: "reference",
            path: "users",
            previewProperties: ["displayName", "email"],
            forceFilter: organization ? { organizations: ["array-contains", new EntityReference(organization, "organizations")] } : undefined
        },
        expanded: false
    })
} 

export const groups = (organization?: string) => {
    return buildProperty({
        name: "Groups",
        dataType: "array",
        of: {
            dataType: "reference",
            path: "organizations/" + organization + "/groups",
            previewProperties: ["name"]
        },
    })
} 

export const canCopy = buildProperty({
    name: "Can copy",
    description: "Users can copy the SkillTree if it is shared",
    dataType: "boolean",
    defaultValue: false,
    columnWidth: 200
})

export const loggedInUsersCanEdit = buildProperty({
    name: "Can update the completion status",
    description: "Users can update the completion status of skills",
    dataType: "boolean",
    defaultValue: true,
    columnWidth: 200
})

export const requireShareApproval = buildProperty({
    name: "Authorize share requests",
    description: "Your approval is needed before users can add to shared SkillTrees",
    dataType: "boolean",
    defaultValue: false,
    columnWidth: 200
})

export const backgroundImage = buildProperty({
    name: "Background",
    dataType: "string",
    storage: {
        storagePath: "images",
        acceptedFiles: ["image/*"]
    }
});

export const gradeAllSkillsByDefault = ({values}: {values: Partial<IComposition>}) => {
    return buildProperty({
        name: "Grade all skills",
        description: "Grade all skills by default using the selected evaluation model",
        dataType: "boolean",
        disabled: !values.evaluationModel
    })
}

export const lastUpdate = buildProperty({
    name: "Last update",
    dataType: "date",
    autoValue: "on_update",
    disabled: {
        hidden: true
    }
});

export const createdAt = buildProperty({
    dataType: "date",
    name: "Created at",
    autoValue: "on_create",
    disabled: {
        hidden: true
    }
});

export const theme = (hideFromCollection: boolean) => {
    const fonts = getLoadedFonts();
    return buildProperty({
        name: "Theme",
        dataType: "map",
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
        hideFromCollection
    })
}
