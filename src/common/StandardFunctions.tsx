import { SavedDataType } from "beautiful-skill-tree";
import { ISkill } from "../types/iskill.type";
import SkillContent from "./SkillContent";

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