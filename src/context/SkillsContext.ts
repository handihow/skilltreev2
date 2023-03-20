import { createContext } from 'react';
import { ISkill } from '../types/iskill.type';

export const SkillsContext = createContext<ISkill[]>([]);