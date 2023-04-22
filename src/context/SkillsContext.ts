import { createContext } from 'react';
import { ISkill } from '../types/iskill.type';
import { SavedDataType } from '../widgets/BST';

type SkillsSettings = {
    skills: ISkill[],
    savedData: SavedDataType
}

export const SkillsContext = createContext<SkillsSettings>({
    skills: [],
    savedData: {}
});