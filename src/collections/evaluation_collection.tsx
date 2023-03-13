import { buildCollection, buildEntityCallbacks, buildProperties, EntityCollection, EntityOnFetchProps, EntityReference, EnumValueConfig } from "firecms";
import { IEvaluationModel } from "./evaluation_model_collection";

export type IEvaluation = {
    id?: string;
    type: string;
    grade?: number;
    percentage?: number;
    letter?: string;
    repeat?: boolean;
    comment?: string;
    student?: any;
    teacher?: any;
    composition?: any;
    skilltree?: any;
    skill?: any;
    evaluationModel?: any;
    createdAt?: Date;
    updatedAt?: Date;
}

export function buildEvaluationsCollection(
    evaluationModel: IEvaluationModel, 
    teacherId?: string,
    studentId?: string
): EntityCollection<IEvaluation> {
    
    const evaluationCallbacks = buildEntityCallbacks({
        onPreSave: ({
            path,
            values,
            status
        }) => {
            // return the updated values
            if(status ==="new") {
                values.student = studentId || "";
                values.teacher = teacherId || "";
                const split = path.split("/");
                values.composition = split.length ? split[1] : "";
                values.skilltree = split.length ? split[3] : "";
                values.skill = split.length ? split[split.length - 2] : "";
                values.evaluationModel = evaluationModel.id || "";
            }
            return values;
        },
        
        onFetch({
            entity,
        }: EntityOnFetchProps) {
            entity.values.student = new EntityReference(entity.values.student, "users");
            entity.values.teacher = new EntityReference(entity.values.teacher, "users");
            entity.values.evaluationModel = new EntityReference(entity.values.evaluationModel, "evaluation_models")
            return entity;
        },
    });
    
    let properties = buildProperties<any>({
        type: {
            name: "Type",
            validation: { required: true },
            readOnly: true,
            dataType: "string",
            defaultValue: evaluationModel.type,
            enumValues: [
                { id: "numerical", label: "Numerical grades", color: "blueDark" },
                { id: "percentage", label: "Percentage grades 0-100%", color: "greenLight" },
                { id: "letter", label: "Letter grades", color: "purpleLighter" }
            ],
        }
    });

    switch (evaluationModel.type) {
        case "numerical":
            properties.grade = {
                name: "Grade",
                validation: {
                    required: true,
                    min: evaluationModel.minimum,
                    max: evaluationModel.maximum
                },
                dataType: "number",
            }
            break;
        case "percentage":
            properties.percentage = {
                name: "Percentage",
                validation: {
                    required: true,
                    min: 0,
                    max: 100,
                    integer: true
                },
                dataType: "number",
            }
            break;
        case "letter":
            const enumValues = evaluationModel.options?.map(v => {
                return {id: v.letter, label: v.description, color: v.color} as EnumValueConfig;
            })
            properties.letter = {
                name: "Result",
                validation: {
                    required: true
                },
                dataType: "string",
                enumValues
            }
            break;
        default:
            break;
    }

    properties.repeat = {
        name: "Repeat",
        description: "Check if this skill has to be repeated.",
        dataType: "boolean"
    }

    properties.comment = {
        name: "comment",
        dataType: "string"
    }

    return buildCollection<IEvaluation>({
        name: "Evaluations",
        description: "Manage evaluations",
        singularName: "Evaluation",
        path: "evaluations",
        group: "Grades",
        icon: "Grading",
        permissions: ({ authController }) => ({
            edit: !authController.extra?.roles?.includes('student'),
            create: !authController.extra?.roles?.includes('student'),
            // we have created the roles object in the navigation builder
            delete: authController.extra?.roles?.includes('super')
        }),
        properties,
        callbacks: evaluationCallbacks
    })
};