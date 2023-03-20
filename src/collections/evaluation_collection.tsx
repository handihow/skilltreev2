import {
    buildCollection,
    buildEntityCallbacks,
    buildProperties,
    buildProperty,
    EntityCollection,
    EntityOnDeleteProps,
    EntityOnFetchProps,
    EntityOnSaveProps,
    EntityReference,
    EnumValueConfig
} from "firecms";
import { getSkillPath } from "../services/composition.service";
import { addEvaluationToHistory } from "../services/evaluation.service";
import { deleteFromPathRecursively } from "../services/firestore";
import { IEvaluationModel } from "../types/ievaluation.model.type";
import { IEvaluation } from "../types/ievaluation.type";

export function buildEvaluationsCollection(
    path: "evaluations" | "history",
    evaluationModel?: IEvaluationModel,
    teacherId?: string,
    studentId?: string,
    compositionId?: string,
    skilltreeId?: string,
    skillId?: string,
): EntityCollection<IEvaluation> {
    const subcollections = evaluationModel || path === "history" ? [] : [
        buildEvaluationsCollection("history"),
    ];
    const evaluationCallbacks = buildEntityCallbacks({
        onPreSave: ({
            values,
            status
        }) => {
            // return the updated values
            if (status === "new") {
                values.student = studentId || "";
                values.teacher = teacherId || "";
                values.composition = compositionId || "";
                values.skilltree = skilltreeId || "";
                values.skill = skillId || "";
                values.evaluationModel = evaluationModel?.id || "";
            } else {
                values.student = values.student.id;
                values.teacher = values.teacher.id;
                values.evaluationModel = values.evaluationModel.id;
            }
            return values;
        },

        onSaveSuccess: (props: EntityOnSaveProps<IEvaluation>) => {
            const savedEvaluation = { id: props.entityId, ...props.values } as IEvaluation;
            addEvaluationToHistory(savedEvaluation);
        },

        onPreDelete: async ({
            path,
            entityId,
        }: EntityOnDeleteProps<IEvaluation>
        ) => {
            console.log(path);
            const collectionPath = path + "/" + entityId + "/history"
            const error = await deleteFromPathRecursively(collectionPath, "History")
            if (error) throw new Error(error);
        },

        async onFetch({
            entity,
        }: EntityOnFetchProps) {
            if (entity.values.student) entity.values.student = new EntityReference(entity.values.student, "users");
            if (entity.values.teacher) entity.values.teacher = new EntityReference(entity.values.teacher, "users");
            if (entity.values.evaluationModel) entity.values.evaluationModel = new EntityReference(entity.values.evaluationModel, "evaluation_models");
            if (entity.values.skill) {
                const [path, error] = await getSkillPath(entity.values.skill);
                console.log(path);
                if (error) throw new Error(error);
                if (!path) throw new Error("Skill path not found")
                const split = path.split("/");
                split.pop()
                entity.values.skill = new EntityReference(entity.values.skill, split.join("/"))
            }
            return entity;
        },
    });

    let properties = buildProperties<any>({
        type: {
            name: "Type",
            validation: { required: true },
            disabled: {
                hidden: true
            },
            dataType: "string",
            defaultValue: evaluationModel?.type,
            enumValues: [
                { id: "numerical", label: "Numerical grades", color: "blueDark" },
                { id: "percentage", label: "Percentage grades 0-100%", color: "greenLight" },
                { id: "letter", label: "Letter grades", color: "purpleLighter" }
            ],
        }
    });

    const gradeProp = buildProperty({
        name: "Grade",
        validation: {
            required: evaluationModel ? true : false,
            min: evaluationModel?.minimum,
            max: evaluationModel?.maximum
        },
        dataType: "number",
    });

    const percProp = buildProperty({
        name: "Percentage",
        validation: {
            required: evaluationModel ? true : false,
            min: 0,
            max: 100,
            integer: true
        },
        dataType: "number",
    });

    const enumValues = evaluationModel?.options?.map(v => {
        return { id: v.letter, label: v.description, color: v.color } as EnumValueConfig;
    })

    const letterProp = buildProperty({
        name: "Result",
        validation: {
            required: evaluationModel ? true : false
        },
        dataType: "string",
        enumValues
    });

    if (evaluationModel) {
        switch (evaluationModel.type) {
            case "numerical":
                properties.grade = gradeProp;
                break;
            case "percentage":
                properties.percentage = percProp;
                break;
            case "letter":

                properties.letter = letterProp;
                break;
            default:
                break;
        }
    } else {
        properties.skill = {
            name: "Skill",
            dataType: "reference",
            path: "skills",
            previewProperties: ["title"],
            readOnly: true
        }
        properties.grade = gradeProp;
        properties.percentage = percProp;
        properties.letter = letterProp;
        properties.student = {
            name: "Student",
            dataType: "reference",
            path: "users",
            previewProperties: ["displayName", "email"],
            readOnly: true
        };
        properties.teacher = {
            name: "Teacher",
            dataType: "reference",
            path: "users",
            previewProperties: ["displayName", "email"],
            readOnly: true
        }
        properties.evaluationModel = {
            name: "Evaluation model",
            dataType: "reference",
            path: "evaluation_models",
            previewProperties: ["name"],
            readOnly: true
        }
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

    properties.createdAt = buildProperty({
        dataType: "date",
        name: "Created at",
        autoValue: "on_create",
        disabled: {
            hidden: true
        }
    });
    properties.updatedAt = buildProperty({
        dataType: "date",
        name: "Updated at",
        autoValue: "on_update",
        disabled: {
            hidden: true
        }
    });

    return buildCollection<IEvaluation>({
        name: path === "evaluations" ? "Evaluations" : "History",
        description: path === "evaluations" ? "Manage evaluations" : undefined,
        singularName: path === "evaluations" ? "Evaluation" : "History",
        path,
        defaultSize: "s",
        group: "Grades",
        icon: "Grading",
        subcollections,
        permissions: ({ authController }) => ({
            edit: !authController.extra?.roles?.includes('student') && path !== "history",
            create: !authController.extra?.roles?.includes('student') && path !== "history",
            // we have created the roles object in the navigation builder
            delete: authController.extra?.roles?.includes('super')
        }),
        properties,
        callbacks: evaluationCallbacks
    })
};