import {
    buildCollection,
    buildEntityCallbacks,
    buildProperties,
    buildProperty,
    EntityCollection,
    EntityOnDeleteProps,
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
        onPreSave: async ({
            values,
            status
        }) => {
            // return the updated values
            if (status === "new") {
                if(!skillId || !evaluationModel?.id || !studentId || !teacherId || ! compositionId || !skilltreeId) throw new Error('Missing necessary information');
                const [path, error] = await getSkillPath(skillId);
                if(error || !path) throw new Error("Missing path info: " + error);
                values.student = new EntityReference(studentId, "users");
                values.teacher = new EntityReference(teacherId, "users");
                values.composition = new EntityReference(compositionId, "compositions");
                values.skilltree = new EntityReference(skilltreeId, "compositions/" + compositionId + "/skilltrees");
                const split = path.split("/");
                split.pop()
                values.skill = new EntityReference(skillId, split.join("/"));
                values.evaluationModel = new EntityReference(evaluationModel.id, "evaluation_models");
            }
            return values;
        },

        onSaveSuccess: (props: EntityOnSaveProps<IEvaluation>) => {
            const savedEvaluation = { 
                id: props.entityId, 
                createdAt: new Date(),
                type: props.values.type,
                percentage: props.values.percentage || null,
                grade: props.values.grade || null,
                letter: props.values.letter || null
            } as IEvaluation;
            const error = addEvaluationToHistory(savedEvaluation);
            if(error) throw new Error(error);
        },

        onPreDelete: async ({
            path,
            entityId,
        }: EntityOnDeleteProps<IEvaluation>
        ) => {
            const collectionPath = path + "/" + entityId + "/history"
            const error = await deleteFromPathRecursively(collectionPath, "History")
            if (error) throw new Error(error);
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

    const gradeProp = buildProperty(({values}) => ({
        name: "Grade",
        disabled: values.repeat && {
            clearOnDisabled: true,
            disabledMessage: "You have set to repeat"
        },
        validation: {
            required: evaluationModel && !values.repeat ? true : false,
            min: evaluationModel?.minimum,
            max: evaluationModel?.maximum
        },
        dataType: "number",
    }));

    const percProp = buildProperty(({values}) => ({
        name: "Percentage",
        disabled: values.repeat && {
            clearOnDisabled: true,
            disabledMessage: "You have set to repeat"
        },
        validation: {
            required: evaluationModel && !values.repeat ? true : false,
            min: 0,
            max: 100,
            integer: true
        },
        dataType: "number",
    }));

    const enumValues = evaluationModel?.options?.map(v => {
        return { id: v.letter, label: v.description, color: v.color } as EnumValueConfig;
    })

    const letterProp = buildProperty(({values}) => ({
        name: "Result",
        disabled: values.repeat && {
            clearOnDisabled: true,
            disabledMessage: "You have set to repeat"
        },
        validation: {
            required: evaluationModel && !values.repeat  ? true : false
        },
        dataType: "string",
        enumValues
    }));

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
    } else if(path === "history") {
        properties.grade = gradeProp;
        properties.percentage = percProp;
        properties.letter = letterProp;
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
            hidden: evaluationModel ? true : false
        }
    });
    properties.updatedAt = buildProperty({
        dataType: "date",
        name: "Updated at",
        autoValue: "on_update",
        disabled: {
            hidden: evaluationModel ? true : false
        }
    });

    return buildCollection<IEvaluation>({
        name: path === "evaluations" ? "Evaluations" : "History",
        description: path === "evaluations" ? "Manage evaluations" : undefined,
        singularName: path === "evaluations" ? "Evaluation" : "History",
        path,
        hideIdFromCollection: true,
        hideIdFromForm: true,
        alias: path === "history" ? undefined : evaluationModel ? "evaluate" : "evaluations",
        defaultSize: "s",
        group: "Grades",
        icon: "Grading",
        subcollections,
        permissions: ({ authController }) => ({
            edit: !authController.extra?.roles?.includes('student') && path !== "history",
            create: false,
            // we have created the roles object in the navigation builder
            delete: authController.extra?.roles?.includes('super')
        }),
        properties,
        callbacks: evaluationCallbacks
    })
};