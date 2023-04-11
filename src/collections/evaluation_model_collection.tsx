import { EntityCollection, buildCollection, buildProperty } from "firecms";
import { chipColors } from "../common/StandardData";
import { IEvaluationModel } from "../types/ievaluation.model.type";

export function buildEvaluationModelCollection(isAdmin: boolean): EntityCollection<IEvaluationModel> {
    
    return buildCollection<IEvaluationModel>({
        name: "Evaluation models",
        description: "Manage evaluation models",
        singularName: "Evaluation model",
        path: "evaluation_models",
        group: "Administration",
        icon: "Grade",
        permissions: ({ authController }) => ({
            edit: authController.extra?.permissions.evaluation_models.edit,
            create: authController.extra?.permissions.evaluation_models.create,
            // we have created the roles object in the navigation builder
            delete: authController.extra?.permissions.evaluation_models.delete
        }),
        defaultSize: "l",
        hideIdFromCollection: true,
        hideIdFromForm: true,
        exportable: false,
        hideFromNavigation: !isAdmin,
        properties: {
            name: {
                name: "Name",
                validation: { required: true },
                dataType: "string"
            },
            type: buildProperty({
                dataType: "string",
                name: "Type",
                enumValues: [
                    { id: "numerical", label: "Numerical grades", color: "blueDark" },
                    { id: "percentage", label: "Percentage grades", color: "greenLight" },
                    { id: "letter", label: "Letter grades", color: "purpleLighter" }
                ],
                validation: { required: true },
            }),
            minimum: ({ values }) => ({
                name: "Minimum",
                dataType: "number",
                disabled: values.type !== 'numerical' && {
                    clearOnDisabled: true,
                    disabledMessage: "You can only set the minimum for numerical grades"
                },
                validation: {
                    required: values.type === 'numerical'
                },
                defaultValue: 1
            }),
            maximum: ({ values }) => ({
                name: "Maximum",
                dataType: "number",
                disabled: values.type !== 'numerical' && {
                    clearOnDisabled: true,
                    disabledMessage: "You can only set the maximum for numerical grades"
                },
                validation: {
                    required: values.type === 'numerical'
                },
                defaultValue: 10
            }),
            passLevel: ({ values }) => ({
                name: "Pass level",
                dataType: "number",
                disabled: values.type === 'letter' && {
                    clearOnDisabled: true,
                    disabledMessage: "You can only set the pass level for numerical grades or percentages"
                },
                validation: {
                    required: values.type !== 'letter',
                    requiredMessage: "You must enter the minimum level to accept as completed / sufficient result"
                }
            }),
            options: ({ values }) => ({
                name: "Options",
                dataType: "array",
                disabled: values.type !== 'letter' && {
                    clearOnDisabled: true,
                    disabledMessage: "You can only set the options for letter grades"
                },
                validation: {
                    required: values.type === 'letter'
                },
                of: {
                    dataType: "map",
                    properties: {
                        letter: {
                            name: "Letter",
                            description: "Letter that will be shown on the label",
                            validation: { required: true, uniqueInArray: true },
                            dataType: "string"
                        },
                        description: {
                            name: "Description",
                            description: "Description of the letter on the label",
                            validation: { required: true },
                            dataType: "string",
                        },
                        color: {
                            name: "Color",
                            description: "Color of the label",
                            validation: { required: true, uniqueInArray: true },
                            dataType: "string",
                            enumValues: chipColors
                        },
                        value: {
                            name: "Calculating value",
                            description: "Calculating value of the label",
                            validation: { required: true },
                            dataType: "number",
                        },
                        minimum: {
                            name: "Minimum value",
                            description: "Minimum value of the label",
                            validation: { required: true },
                            dataType: "number",
                        },
                        maximum: {
                            name: "Maximum",
                            description: "Maximum value of the label",
                            validation: { required: true },
                            dataType: "number",
                        },
                        valuePasses: {
                            name: "Passes",
                            description: "Label passes as completed / sufficient result",
                            validation: { required: true },
                            dataType: "boolean"
                        }
                    }
                }
            }),
            repeatOption: buildProperty({
                name: "Repeat option",
                description: "Repeat can be assigned to students who have to repeat the assignment. No grade is given.",
                dataType: "map",
                properties: {
                    letter: {
                        name: "Letter",
                        description: "Letter that will be shown on the repeat label",
                        validation: { required: true },
                        dataType: "string"
                    },
                    description: {
                        name: "Description",
                        description: "Description of the letter on the repeat label",
                        validation: { required: true },
                        dataType: "string",
                    },
                    color: {
                        name: "Color",
                        description: "Color of the label",
                        validation: { required: true },
                        dataType: "string",
                        enumValues: chipColors
                    },
                }
            }),
            createdAt: buildProperty({
                dataType: "date",
                name: "Created at",
                autoValue: "on_create",
                disabled: {
                    hidden: true
                }
            }),
            updatedAt: buildProperty({
                dataType: "date",
                name: "Updated at",
                autoValue: "on_update",
                disabled: {
                    hidden: true
                }
            })
        }
    })
};