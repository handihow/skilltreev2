import { CircularProgress } from "@mui/material";
import { NodeSelectEvent, SavedDataType, SkillTree } from "beautiful-skill-tree";
import { collectionGroup, query, where, orderBy, onSnapshot, doc, getDoc, QuerySnapshot } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { useSideEntityController, useSnackbarController } from "firecms";
import { useEffect, useState } from "react";
import { ISkilltree } from "../../collections/skilltree_collection"
import { ISkill, skillsCollection } from "../../collections/skill_collection";
import { AutocompleteOption } from "../../common/AutoCompleteOption.model";
import { skillArrayToSkillTree } from "../../common/StandardFunctions";
import { db, deleteFromPathRecursively, storage } from "../../services/firestore"

export function SkillTreeWidget({
    mode,
    skilltree,
    handleSave,
    selectedUser,
    handleNodeSelect
}: {
    mode: "viewer" | "editor"
    skilltree: ISkilltree,
    handleSave: Function | undefined,
    selectedUser: AutocompleteOption | null,
    handleNodeSelect: Function | undefined
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
                if(!isLoading) setIsLoading(true);
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
        return <CircularProgress sx={{margin: "20px"}} />
    } else {
        return <SkillTreeWithData
            mode={mode}
            skilltree={skilltree}
            handleSave={handleSave}
            selectedUser={selectedUser}
            skills={skillsList}
            handleNodeSelect={handleNodeSelect}
        />
    }
}

function SkillTreeWithData({
    mode,
    skilltree,
    handleSave,
    selectedUser,
    skills,
    handleNodeSelect
}: {
    mode: "viewer" | "editor"
    skilltree: ISkilltree,
    handleSave: Function | undefined,
    selectedUser: AutocompleteOption | null,
    skills: ISkill[],
    handleNodeSelect: Function | undefined
}) {

    
    const snackbarController = useSnackbarController();
    const sideEntityController = useSideEntityController();
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [savedData, setSavedData] = useState<SavedDataType>({});

    const handleError = (error: string, setLoadingToFalse = true) => {
        snackbarController.open({
            type: "error",
            message: error
        })
        if (setLoadingToFalse) setIsLoading(false);
    }

    const openSkillController = (id: string, mode?: string) => {
        const skill = skills.find(s => s.id === id);
        console.log(skill);
        const pathAsArray = skill?.path?.split("/");
        if (mode === "child") {
            pathAsArray?.push("skills");
        } else {
            pathAsArray?.pop();
        }
        sideEntityController.open({
            entityId: mode === "edit" ? id : undefined,
            path: pathAsArray?.join("/") || "",
            collection: skillsCollection
        })
    }


    const deleteSkill = async ({ id }: { id: string }) => {
        const skill = skills.find(s => s.id === id);
        console.log(skill);
        if (!skill?.path) return handleError("No skill path available", false);
        const error = await deleteFromPathRecursively(skill.path, "Skills")
        if (error) handleError(error, false);
    }

    const transformSkills = (skills: ISkill[]) => {
        const transformedSkills = skillArrayToSkillTree(
            skills,
            mode === "editor",
            openSkillController,
            deleteSkill
        );
        return transformedSkills;
    }

    const getViewerData = async () => {
        setIsLoading(true)
        if (!selectedUser) {
            setTimeout(() => {
                setSavedData({});
                setIsLoading(false);
            })
            return;
        };
        try {
            const resultRef = doc(db, 'results', selectedUser?.id || "", 'skilltrees', skilltree.id || "");
            const result = await getDoc(resultRef);
            const resultObj = result.exists() ? result.data()?.skills : {};
            setSavedData(resultObj);
            setIsLoading(false);
        } catch (err: any) {
            snackbarController.open({
                type: "error",
                message: err.message
            });
            setIsLoading(false);
        }
    }

    useEffect(() => {
        const transformedSkills = transformSkills(skills);
        setData(transformedSkills);
        if(mode ==="editor") return  setIsLoading(false);
        getViewerData();
    }, [selectedUser, skills])

    const nodeSelection = (e: NodeSelectEvent) => {
        if(!handleNodeSelect || e.state!=="selected") return;
        const skill = skills.find(s => s.id === e.key);
        handleNodeSelect(skill);
    }

    if (isLoading) {
        return <CircularProgress sx={{margin: "20px"}} />
    } else {
        return <SkillTree
        treeId={skilltree.id || ""}
        title={skilltree.title}
        data={data}
        collapsible={skilltree.collapsible}
        closedByDefault={skilltree.closedByDefault}
        disabled={skilltree.disabled}
        description={skilltree.description}
        handleSave={selectedUser && handleSave ? (_storage, treeId, skills) => handleSave(treeId, skills) : undefined}
        savedData={savedData}
        handleNodeSelect={handleNodeSelect ? (e) => nodeSelection(e) : undefined}
    />
    }

}