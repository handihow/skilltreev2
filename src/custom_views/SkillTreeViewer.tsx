import React, { useEffect, useState } from "react";
import {
    SkillTreeGroup,
    SkillProvider,
    SavedDataType,
} from "beautiful-skill-tree";
import {
    Autocomplete,
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CircularProgress,
    Container,
    TextField,
    Typography,
} from "@mui/material";
import {
    useAuthController, useSideEntityController, useSnackbarController, useStorageSource,
} from "firecms";
import { IComposition } from "../collections/composition_collection";
import { ISkilltree } from "../collections/skilltree_collection"
import { useNavigate, useParams } from "react-router";
import { AutocompleteOption } from "../common/AutoCompleteOption.model";
import { AlertDialog } from "./widgets/AlertDialog";
import { SkillTreeWidget } from "./widgets/SkillTreeWidget";
import { ISkill } from "../collections/skill_collection";
import { IEvaluationModel } from "../collections/evaluation_model_collection";
import { buildEvaluationsCollection } from "../collections/evaluation_collection";
import { getComposition, getCompositionSkilltrees } from "../services/composition.service";
import { getEvaluationModel, getEvaluatedSkill } from "../services/evaluation.service";
import { getSharedUsers, saveUserResults } from "../services/user.service";

export function SkillTreeViewer() {
    // hook to display custom snackbars
    const snackbarController = useSnackbarController();
    const navigate = useNavigate();
    // hook to do operations related to authentication
    const authController = useAuthController();
    const storageSource = useStorageSource();
    const sideEntityController = useSideEntityController();

    const initialList: ISkilltree[] = []
    const [skilltreesList, setSkilltreeList] = useState(initialList);
    const [composition, setComposition] = useState<IComposition | null>(null);
    const [url, setUrl] = useState("");
    const [evaluationModel, setEvaluationModel] = useState<IEvaluationModel | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [users, setUsers] = useState<AutocompleteOption[]>([])
    const initialAutocompleteOption: AutocompleteOption = { id: authController.user?.uid || "", label: "Your own results" };
    const [selectedUser, setSelectedUser] = useState<AutocompleteOption | null>(initialAutocompleteOption);

    const { id } = useParams();

    const handleError = (error: string, setLoadingToFalse = true) => {
        snackbarController.open({
            type: "error",
            message: error
        })
        if (setLoadingToFalse) setIsLoading(false);
    }

    const initialize = async () => {
        if (!authController.user || !id) return;
        const [composition, error] = await getComposition(id);
        if (error) return handleError(error);
        if(!composition) return handleError("Could not find the composition");
        let url = '';
        if (composition.backgroundImage) {
            try {
                const config = await storageSource.getDownloadURL(composition.backgroundImage);
                url = config.url;
            } catch (e) {
                console.log(e);
            }
        }
        if(composition.evaluationModel) {
            const [evaluationModel, _error2] = await getEvaluationModel(composition.evaluationModel);
            if(evaluationModel) setEvaluationModel(evaluationModel);

        }
        const [skilltrees, error3] = await getCompositionSkilltrees(id);
        if (error3) return handleError(error3);
        const [labels, error4] = await getSharedUsers(id, authController.user.uid);
        if (error4) return handleError(error4);
        if (labels) setUsers([initialAutocompleteOption, ...labels]);
        if (url) setUrl(url);
        setSkilltreeList(skilltrees || []);
        setComposition(composition);
        setIsLoading(false);
    }

    useEffect(() => {
        initialize();
    }, [])

    const { user, extra: { roles = [] } } = authController;
    const isAdmin = user?.uid === composition?.user || roles.includes("admin") || roles.includes("super");

    const handleSave = async (treeId: string, skills: SavedDataType) => {
        if (isLoading || !user || !composition || !selectedUser) return;
        const canSave = isAdmin || composition?.loggedInUsersCanEdit;
        if (!canSave) return handleError("Please ask your instructor to update the completion status of this skill. Changes will not be saved.");
        const error = await saveUserResults(selectedUser.id, treeId, composition?.id, skills, 0);
        if (error) return handleError(error, false);
    }


    const handleAdminNodeSelect = async (skill: ISkill) => {
        if(!selectedUser || !skill.path) return;
        if(!evaluationModel) return handleError("You must set an evaluation model to grade this skill. Check the SkillTree settings.", false);
        if(skill.gradeSkill === "not_graded") return handleError("This skill is not graded. Check the SkillTree settings.", false);
        if(!composition?.gradeAllSkillsByDefault && skill.gradeSkill !== "graded") return handleError("This skill is not graded. Check the SkillTree settings.", false);
        const split = skill.path.split("/");
        const compositionId = split.length ? split[1] : "";
        const skilltreeId = split.length ? split[3] : "";
        const [id, error] = await getEvaluatedSkill(selectedUser.id, skill.id || "");
        if(error) handleError(error);
        sideEntityController.open({
            entityId: id ? id : undefined,
            path: "evaluations",
            collection: buildEvaluationsCollection("evaluations", evaluationModel, authController.user?.uid, selectedUser.id, compositionId, skilltreeId, skill.id),
        })
    }

    const handleStudentNodeSelect = (skill: ISkill) => {
        console.log(skill)
    }

    return (
        <Box style={{
            backgroundImage: `url(${url})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
            height: '100%',
            width: '100%',
            display: 'flex',
            overflowY: 'auto'
        }}>
            <Container maxWidth={"xl"}
                sx={{
                    alignItems: "center",
                    justifyItems: "center",
                    display: "flex",
                    flexDirection: "column"
                }}>
                {isLoading ? <CircularProgress /> :
                    <SkillProvider>
                        <SkillTreeGroup theme={composition?.theme}>
                            {({ handleFilter, resetSkills }) => (
                                <React.Fragment>
                                    <Card sx={{ marginTop: 2, alignSelf: 'flex-start' }}>
                                        <CardContent>
                                            <Typography variant="h6" component="div" sx={{ marginBottom: 3 }}>
                                                {composition?.title}
                                            </Typography>
                                            {isAdmin &&
                                                <Autocomplete
                                                    value={selectedUser}
                                                    onChange={(event: any, newValue: AutocompleteOption | null) => {
                                                        setSelectedUser(newValue);
                                                    }}
                                                    isOptionEqualToValue={(option, value) => {
                                                        return option.id === value.id
                                                    }}
                                                    disablePortal
                                                    id="combo-box-demo"
                                                    options={users}
                                                    sx={{ width: 300 }}
                                                    renderInput={(params) => <TextField {...params} label="User results" />}
                                                />
                                            }
                                            <TextField sx={{ width: 300, marginTop: 3 }} id="text-field" label="Filter skills" onChange={(event: any) => handleFilter(event.target.value || "")} />
                                        </CardContent>
                                        <CardActions>
                                            <AlertDialog
                                                agreeFunction={resetSkills}
                                                functionParams={undefined}
                                                agreeBtnText="Yes, reset!"
                                                openBtnText="Reset"
                                                alertWarning="Are you sure that you want to reset the completion status of all skills?"
                                                btnColor="error"
                                            />
                                            <Button aria-label="delete" size="small" onClick={() => navigate(-1)}>
                                                Back
                                            </Button>
                                            {composition?.pendingApprovalUsers?.length && composition.pendingApprovalUsers.length > 0 ?
                                                <Button onClick={() => navigate("/share_requests/" + id)}>Approvals</Button> : <React.Fragment></React.Fragment>}
                                        </CardActions>
                                    </Card>
                                    {skilltreesList.map((skilltree) => (
                                        <SkillTreeWidget
                                            key={skilltree.id}
                                            mode="viewer"
                                            skilltree={skilltree}
                                            handleSave={handleSave}
                                            selectedUser={selectedUser}
                                            handleNodeSelect={isAdmin ? handleAdminNodeSelect : handleStudentNodeSelect}
                                            isAdmin={isAdmin}
                                        ></SkillTreeWidget>
                                    ))}
                                </React.Fragment>
                            )}
                        </SkillTreeGroup>
                    </SkillProvider>
                }
            </Container>
        </Box>
    );
}