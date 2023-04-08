import { CircularProgress } from "@mui/material";
import { SavedDataType, SkillTree } from "beautiful-skill-tree";
import { collectionGroup, query, where, orderBy, onSnapshot, doc, QuerySnapshot, Unsubscribe } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { useSnackbarController } from "firecms";
import { useContext, useEffect, useState } from "react";
import { SkillsContext } from "../context/SkillsContext";
import { skillArrayToSkillTree } from "../common/StandardFunctions";
import { ViewerContext } from "../context/ViewerContext";
import { storage, db } from "../services/firestore";
import { ISkill } from "../types/iskill.type";
import { ISkilltree } from "../types/iskilltree.type";


export function SkillTreeWidget({
    skilltree,
    handleSave
}: {
    skilltree: ISkilltree,
    handleSave: Function | undefined
}) {

    const snackbarController = useSnackbarController();
    const [skillsList, setSkillsList] = useState<ISkill[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handleError = (error: string, setLoadingToFalse = true) => {
        snackbarController.open({
            type: "error",
            message: error
        })
        if (setLoadingToFalse) setIsLoading(false);
    }

    const transformSkills = async (snap: QuerySnapshot) => {
        const skills: ISkill[] = [];
        for (const doc of snap.docs) {
            const skill: ISkill = {
                parent: doc.ref.path.split("/"),
                path: doc.ref.path,
                ...(doc.data() as ISkill),
            };
            if (skill.image) {
                const resized = skill.image.split(".")[0] + "_128x128." + skill.image.split(".")[1];
                const reference = ref(storage, resized);
                skill.icon = await getDownloadURL(reference);
            }
            skills.push(skill);
        }
        return skills;
    }

    //in editor mode, subscribe to changes
    useEffect(() => {
        const skillsColRef = collectionGroup(db, 'skills');
        const skillQuery = query(skillsColRef, where("skilltree", "==", skilltree.id), orderBy("order"));
        const unsubscribe = onSnapshot(skillQuery, {
            next: async (snap) => {
                if (!isLoading) setIsLoading(true);
                const skills = await transformSkills(snap);
                setSkillsList(skills);
                setIsLoading(false);
            },
            error: (err) => {
                handleError(err.message);
            }
        })
        return () => unsubscribe();
    }, [])

    if (isLoading) {
        return <CircularProgress sx={{ margin: "50px" }} />
    } else {
        return <SkillTreeWithData
            skilltree={skilltree}
            handleSave={handleSave}
            skills={skillsList}
        />
    }
}

function SkillTreeWithData({
    skilltree,
    handleSave,
    skills,
}: {
    skilltree: ISkilltree,
    handleSave: Function | undefined,
    skills: ISkill[]
}) {

    const snackbarController = useSnackbarController();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [subscriptions, setSubscriptions] = useState<Unsubscribe[]>([]);
    const [savedData, setSavedData] = useState<SavedDataType>({});
    const content = useContext(ViewerContext);

    const transformSkills = (skills: ISkill[]) => {
        const transformedSkills = skillArrayToSkillTree(
            skills
        );
        return transformedSkills;
    }

    const getViewerData = async () => {
        setIsLoading(true)
        if (!content.selectedUser) {
            setTimeout(() => {
                setSavedData({});
                setIsLoading(false);
            })
            return;
        };
        const resultRef = doc(db, 'results', content.selectedUser?.id || "", 'skilltrees', skilltree.id || "");
        const unsubscribe = onSnapshot(resultRef, {
            next: (result) => {
                const resultObj = result.exists() ? result.data()?.skills : {};
                setSavedData(resultObj);
                setIsLoading(false);
            },
            error: (err: any) => {
                snackbarController.open({
                    type: "error",
                    message: err.message
                });
                setIsLoading(false);
            }
        });
        setSubscriptions([...subscriptions, unsubscribe])
    }

    useEffect(() => {
        const transformedSkills = transformSkills(skills);
        setData(transformedSkills);
        if (content.mode === "editor") return setIsLoading(false);
        getViewerData();
        return () => {
            subscriptions.forEach(unsubscribe => unsubscribe());
        }
    }, [content.selectedUser, skills])

    if (isLoading) {
        return <CircularProgress sx={{ margin: "20px" }} />
    } else {
        return <SkillsContext.Provider value={{
            skills,
            savedData
        }}>
            <SkillTree
                treeId={skilltree.id || ""}
                title={skilltree.title}
                data={data}
                collapsible={skilltree.collapsible}
                closedByDefault={skilltree.closedByDefault}
                disabled={skilltree.disabled}
                description={skilltree.description}
                handleSave={content.selectedUser && handleSave ? (_storage, treeId, skills) => handleSave(treeId, skills) : undefined}
                savedData={savedData}
            />
        </SkillsContext.Provider>
    }

}