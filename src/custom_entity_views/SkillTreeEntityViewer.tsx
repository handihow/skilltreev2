import { useEffect, useState } from "react";
import {
    SkillTreeGroup,
    SkillTree,
    SkillProvider,
    SkillGroupDataType,
} from "beautiful-skill-tree";
import {
    Box,
    CircularProgress,
    Container,
} from "@mui/material";
import {
    EntityCustomViewParams, useAuthController, useSnackbarController,
} from "firecms";
import { IComposition } from "../collections/composition_collection";
import { ISkilltree } from "../collections/skilltree_collection"
import { getCompositionSkilltrees } from "../services/firestore"

export function SkillTreeEntityViewer({ entity }: EntityCustomViewParams<IComposition>) {
    // hook to display custom snackbars
    const snackbarController = useSnackbarController();
    // hook to do operations related to authentication
    const authController = useAuthController();

    const initialList: ISkilltree[] = []
    const [skilltreesList, setSkilltreeList] = useState(initialList);

    const [isLoading, setIsLoading] = useState(true);

    const handleError = (error: string, setLoadingToFalse = true) => {
        snackbarController.open({
            type: "error",
            message: error
        })
        if (setLoadingToFalse) setIsLoading(false);
    }
    const initialize = async () => {
        if (!authController.user) return handleError("No user found");
        if (!entity) return handleError("Entity not found");
        const [skilltrees, _skillCount, error] = await getCompositionSkilltrees(entity.id);
        if (error) return handleError(error);
        setSkilltreeList(skilltrees || []);
        setIsLoading(false);
    }

    useEffect(() => {
        if(!entity) return;
        initialize();
    }, [entity])

    return (
        <Box>

            <Container maxWidth={"md"}
                sx={{
                    alignItems: "center",
                    justifyItems: "center",
                    display: "flex",
                    flexDirection: "column"
                }}>
                {!entity || isLoading ? <CircularProgress /> :

                        <SkillProvider>
                            <SkillTreeGroup theme={entity.values.theme}>
                                {(treeData: SkillGroupDataType) => (
                                    skilltreesList.map((skilltree, index) => (
                                        <SkillTree
                                            key={skilltree.id}
                                            treeId={skilltree.id || ""}
                                            title={skilltree.title}
                                            data={skilltree.data}
                                            collapsible={skilltree.collapsible}
                                            description={skilltree.description}
                                        />))
                                )}
                            </SkillTreeGroup>
                        </SkillProvider>

                }
            </Container>
        </Box>
    );

}