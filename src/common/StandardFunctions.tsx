import { SavedDataType } from "beautiful-skill-tree";
import { ISkilltree } from "../collections/skilltree_collection";
import { ISkill } from "../collections/skill_collection";
import SkillContent from "./SkillContent";

export const countSelectedSkills = (data: SavedDataType[]) => {
    let count = 0;
    for (const skilltreeResult of data) {
        for (const key of Object.keys(skilltreeResult)) {
            if(skilltreeResult[key].nodeState === 'selected') count++;
        }
    }
    return count;
}

export const skillTreeToSkillArray = (skills: ISkill[], isViewing: boolean) => {
    const skillArray: ISkill[] = [];
    skills.forEach((child, index) => {
        addToSkillArray(skillArray, child, [{parentId: 'root', childIndex: index}], isViewing);
    })
    return skillArray;
}

const constructSkill = (skill: ISkill, skills: ISkill[], isViewing: boolean) => {
    let constructedSkill;
    if(isViewing){
        constructedSkill = {
            tooltip: {
                content: <SkillContent 
                    description={skill.description} 
                    links={skill.links ? skill.links : []}
                    optional={skill.optional ? true : false}/>,
                direction: skill.direction ? skill.direction : 'top'
            } ,
            children: filterChildren(skill, skills, isViewing),
            links: skill.links? skill.links : [],
            ...skill
        };
    } else {
        constructedSkill = {
            expanded: true,
            children: filterChildren(skill, skills, isViewing),
            ...skill
        }
    }
    return constructedSkill;    
}

const filterChildren = (skill: ISkill, skills: ISkill[], isViewing: boolean) => {
    const children : any[] = [];
    let rawChildren = skills.filter(s => skill.parent && s.parent?.length === skill.parent.length + 2 && s.parent.includes(skill?.id || ""));
    rawChildren.forEach(rawChild => {
        let childSkill = constructSkill(rawChild, skills, isViewing);
        children.push(childSkill);
    });
    return children
}

export const skillArrayToSkillTree = (skills: ISkill[], isViewing: boolean) => {
    //first, extract all the root skills
    let skilltree : any[] = [];
    skills.forEach((skill, index) => {
        if(skill.parent?.length===6){
            let rootSkill = constructSkill(skill, skills, isViewing);
            //this is a root skill
            skilltree.push(rootSkill);
        }
    })
    return(skilltree);
}

const addToSkillArray = (arr: ISkill[], child: ISkill, parent: any, isViewing: boolean) => {
    let flatSkill : ISkill = {
        id: child.id,
        title: child.title,
        optional: child.optional ? true : false,
        tooltip: {
            content: <SkillContent 
                        description={child.tooltip.description} 
                        links={child.tooltip.links} 
                        optional={child.optional ? true : false}/> ,
            description: child.tooltip.description,
            links: child.tooltip.links,
        },
        parent: parent,
        children: [],
        countChildren: child.children?.length || 0
    };
    if(child.icon){
        flatSkill.icon = child.icon
    }
    if(child.direction){
        flatSkill.direction = child.direction
    }
    arr.push(flatSkill);
    if(child.children && child.children.length>0){
        child.children.forEach((nestedChild, index) => {
            addToSkillArray(
                arr, nestedChild, 
                [
                    ...flatSkill.parent || [], 
                    {parentId: flatSkill.id, childIndex: index}
                ], isViewing
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
    return arr.every( item => item[property] === arr[0][property]);
}