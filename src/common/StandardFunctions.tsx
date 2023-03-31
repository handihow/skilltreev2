import { SavedDataType } from "beautiful-skill-tree";
import { IComposition } from "../types/icomposition.type";
import { IEvaluationModel } from "../types/ievaluation.model.type";
import { IEvaluation } from "../types/ievaluation.type";
import { InfoChip } from "../types/infoChip.type";
import { ISkill } from "../types/iskill.type";
import SkillContent from "../widgets/SkillContent";
import { CHIP_COLORS } from "./StandardData";

export const countSelectedSkills = (data: SavedDataType[]) => {
    let count = 0;
    for (const skilltreeResult of data) {
        for (const key of Object.keys(skilltreeResult)) {
            if (skilltreeResult[key].nodeState === 'selected') count++;
        }
    }
    return count;
}

export const skillTreeToSkillArray = (skills: ISkill[]) => {
    const skillArray: ISkill[] = [];
    skills.forEach((child, index) => {
        addToSkillArray(skillArray, child, [{ parentId: 'root', childIndex: index }]);
    })
    return skillArray;
}

const constructSkill = (
    skill: ISkill, skills: ISkill[]
) => {
    return {
        tooltip: {
            content: <SkillContent
                id={skill.id || ""}
                description={skill.description}
                links={skill.links ? skill.links : []}
                optional={skill.optional ? true : false}
            />,
            direction: skill.direction ? skill.direction : 'top'
        },
        children: filterChildren(skill, skills),
        links: skill.links ? skill.links : [],
        ...skill
    };

}

const filterChildren = (
    skill: ISkill,
    skills: ISkill[]
) => {
    const children: any[] = [];
    let rawChildren = skills.filter(s => skill.parent && s.parent?.length === skill.parent.length + 2 && s.parent.includes(skill?.id || ""));
    rawChildren.forEach(rawChild => {
        let childSkill = constructSkill(rawChild, skills);
        children.push(childSkill);
    });
    return children
}

export const skillArrayToSkillTree = (
    skills: ISkill[]
) => {
    //first, extract all the root skills
    let skilltree: any[] = [];
    skills.forEach((skill) => {
        if (skill.parent?.length === 6) {
            let rootSkill = constructSkill(skill, skills);
            //this is a root skill
            skilltree.push(rootSkill);
        }
    })
    return (skilltree);
}

const addToSkillArray = (
    arr: ISkill[],
    child: ISkill,
    parent: any
) => {
    let flatSkill: ISkill = {
        id: child.id,
        title: child.title,
        optional: child.optional ? true : false,
        tooltip: {
            content: <SkillContent
                id={child.id || ""}
                description={child.tooltip.description}
                links={child.tooltip.links}
                optional={child.optional ? true : false}
            />,
            description: child.tooltip.description,
            links: child.tooltip.links,
        },
        parent: parent,
        children: [],
        countChildren: child.children?.length || 0
    };
    if (child.icon) {
        flatSkill.icon = child.icon
    }
    if (child.direction) {
        flatSkill.direction = child.direction
    }
    arr.push(flatSkill);
    if (child.children && child.children.length > 0) {
        child.children.forEach((nestedChild, index) => {
            addToSkillArray(
                arr, nestedChild,
                [
                    ...flatSkill.parent || [],
                    { parentId: flatSkill.id, childIndex: index }
                ]
            );
        })
    }
}

export const arraysEqual = (a: any[], b: any[]) => {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

export const propertyInArrayEqual = (arr: any[], property: string | number) => {
    return arr.every(item => item[property] === arr[0][property]);
}

export const convertToDateTimeString = (dateObj: Date) => {

    const localeDateStr = dateObj.toLocaleDateString();

    const hour = dateObj.getHours();
    const hourStr = ('0' + hour).slice(-2);
    // To make sure the hour always has 2-character-format

    const minute = dateObj.getMinutes();
    const minuteStr = ('0' + minute).slice(-2);

    return `${localeDateStr} at ${hourStr}:${minuteStr}`;

}

export const isGradedSkill = (composition: IComposition | null, skill: ISkill | undefined) => {
    return skill?.gradeSkill === "graded" || (composition?.gradeAllSkillsByDefault && skill?.gradeSkill !== "not_graded") || false;
}

// export const processGradeChip = (
//     composition: IComposition | null, 
//     skill: ISkill | undefined, 
//     evaluations: IEvaluation[], 
//     evaluationModel: IEvaluationModel | null,
//     onChip = true
// ) : [boolean, IEvaluation | undefined, InfoChip] => {
//     let isGraded = false;
//     let evaluation : IEvaluation | undefined = undefined;

//     let gradeChip: InfoChip = {
//         hasGrade: false,
//         label: "",
//         color: undefined,
//         bgColor: undefined
//     }

//     if (skill?.gradeSkill === "graded" || (composition?.gradeAllSkillsByDefault && skill?.gradeSkill !== "not_graded")) {
//         isGraded = true;
//         evaluation = evaluations.find(e => e.skill.id == skill?.id);
//         if (evaluation) {
//             gradeChip.hasGrade = true;
//             switch (evaluation.type) {
//                 case "percentage":
//                     if (evaluationModel?.passLevel && evaluation.percentage && evaluationModel.passLevel > evaluation.percentage) {
//                         gradeChip.bgColor = CHIP_COLORS["redLight"].color;
//                         gradeChip.color = CHIP_COLORS["redLight"].text;
//                     } else {
//                         gradeChip.bgColor = CHIP_COLORS["greenDark"].color;
//                         gradeChip.color = CHIP_COLORS["greenDark"].text;
//                     };
//                     if(onChip) gradeChip.label += "Graded "
//                     gradeChip.label += evaluation.percentage?.toString() + " %";
//                     break;
//                 case "numerical":
//                     if (evaluationModel?.passLevel && evaluation.grade && evaluationModel.passLevel >= evaluation.grade) {
//                         gradeChip.bgColor = CHIP_COLORS["redLight"].color;
//                         gradeChip.color = CHIP_COLORS["redLight"].text;
//                     } else {
//                         gradeChip.bgColor = CHIP_COLORS["greenDark"].color;
//                         gradeChip.color = CHIP_COLORS["greenDark"].text;
//                     };
//                     if(onChip) gradeChip.label += "Graded "
//                     gradeChip.label += evaluation.grade?.toString() || "";
//                     break;
//                 case "letter":
//                     const option = evaluationModel?.options?.find(o => o.letter === evaluation?.letter);
//                     if(option) {
//                         gradeChip.bgColor = CHIP_COLORS[option.color].color;
//                         gradeChip.color = CHIP_COLORS[option.color].text;
//                         if(onChip) {
//                             gradeChip.label = option.description;
//                         } else {
//                             gradeChip.label = option.letter;
//                         }
//                     }
//                     break;
//                 default:
//                     break;
//             }
//             if(evaluation.repeat) {
//                 gradeChip.label = "Repeat";
//                 gradeChip.bgColor = CHIP_COLORS["grayLighter"].color;
//                 gradeChip.color = CHIP_COLORS["grayLighter"].text;
//             }
//         }
//     };

//     return [isGraded, evaluation, gradeChip];

// }

export const calculateSkilltreeGrade = (evaluations: IEvaluation[], skills: ISkill[], evaluationModel: IEvaluationModel) => {

    let result = "";
    if (!evaluations || evaluations.length === 0) return result;

    let nums: number[] = [];
    let weights: number[] = [];

    for (const evaluation of evaluations) {
        if (evaluation.repeat) continue;
        if (evaluationModel.type === "letter") {
            const option = evaluationModel?.options?.find(o => o.letter === evaluation?.letter);
            if (option) {
                nums.push(option.value);
            } else {
                continue;
            }
        } else if (evaluationModel.type === "numerical" && evaluation.grade) {
            nums.push(evaluation.grade);
        } else if (evaluationModel.type === "percentage" && evaluation.percentage) {
            nums.push(evaluation.percentage);
        } else {
            continue;
        }
        const skill = skills.find(s => s.id === evaluation.skill.id);
        if (skill && skill.weight) {
            weights.push(skill.weight);
        } else {
            weights.push(1);
        }
    }
    const average = weightedAverage(nums, weights);
    if (evaluationModel.type === "letter") {
        const option = evaluationModel?.options?.find(o => average >= o.minimum && average <= o.maximum);
        if (option) result = option.letter;
    } else {
        result = average.toFixed(1).toString();
    }

    return result;
}

const weightedAverage = (nums: number[], weights: number[]) => {
    const [sum, weightSum] = weights.reduce(
        (acc, w, i) => {
            acc[0] = acc[0] + nums[i] * w;
            acc[1] = acc[1] + w;
            return acc;
        },
        [0, 0]
    );
    return sum / weightSum;
};