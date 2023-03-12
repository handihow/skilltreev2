import React, { useEffect, useState } from "react";
import {
    SkillTreeGroup,
    SkillProvider,
    SavedDataType,
    NodeSelectEvent,
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
    useAuthController, useSnackbarController, useStorageSource,
} from "firecms";
import { IComposition } from "../collections/composition_collection";
import { ISkilltree } from "../collections/skilltree_collection"
import { getComposition, getCompositionSkilltrees, getSharedUsers, saveUserResults } from "../services/firestore"
import { useNavigate, useParams } from "react-router";
import { AutocompleteOption } from "../common/AutoCompleteOption.model";
import { AlertDialog } from "./widgets/AlertDialog";
import { SkillTreeWidget } from "./widgets/SkillTreeWidget";
import { ISkill } from "../collections/skill_collection";

export function SkillTreeViewer() {
    // hook to display custom snackbars
    const snackbarController = useSnackbarController();
    const navigate = useNavigate();
    // hook to do operations related to authentication
    const authController = useAuthController();
    const storageSource = useStorageSource();

    const initialList: ISkilltree[] = []
    const [skilltreesList, setSkilltreeList] = useState(initialList);
    const [composition, setComposition] = useState<IComposition | null>(null);
    const [url, setUrl] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
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
        let url = '';
        if (composition?.backgroundImage) {
            try {
                const config = await storageSource.getDownloadURL(composition.backgroundImage);
                url = config.url;
            } catch (e) {
                console.log(e);
            }
        }
        const [skilltrees, error2] = await getCompositionSkilltrees(id);
        if (error2) return handleError(error2);
        const [labels, error3] = await getSharedUsers(id, authController.user.uid);
        if (error3) return handleError(error3);
        if (labels) setUsers([initialAutocompleteOption, ...labels]);
        if (url) setUrl(url);
        setSkilltreeList(skilltrees || []);
        setComposition(composition);
        setIsOwner(composition?.user === authController.user?.uid);
        setIsLoading(false);
    }

    useEffect(() => {
        initialize();
    }, [])

    const handleSave = async (treeId: string, skills: SavedDataType) => {
        const { user, extra: { roles = [] } } = authController;
        if (isLoading || !user || !composition || !selectedUser) return;
        const isAdmin = user.uid === composition?.user || roles.includes("admin") || roles.includes("super");
        const canSave = isAdmin || composition?.loggedInUsersCanEdit;
        if (!canSave) return handleError("Please ask your instructor to update the completion status of this skill. Changes will not be saved.");
        console.log('saving user results');
        const error = await saveUserResults(selectedUser.id, treeId, composition?.id, skills, 0);
        if (error) return handleError(error, false);
    }


    const handleNodeSelect = (skill: ISkill) => {
        if(skill.gradeSkill || (!skill.gradeSkill && composition?.gradeAllSkillsByDefault)){
            console.log('must open for editing the results');
            console.log(skill);
        }
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
                                            {isOwner &&
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
                                            handleNodeSelect={handleNodeSelect}
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