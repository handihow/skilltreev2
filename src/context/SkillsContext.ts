import { SavedDataType } from 'beautiful-skill-tree';
import { createContext } from 'react';
import { ISkill } from '../types/iskill.type';

type SkillsSettings = {
    skills: ISkill[],
    savedData: SavedDataType
}

export const SkillsContext = createContext<SkillsSettings>({
    skills: [],
    savedData: {}
});