import React, { useEffect, useState } from "react";
import {
    SkillTreeGroup,
    SkillTree,
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
    useAuthController, useSnackbarController, useStorageSource,
} from "firecms";
import { IComposition } from "../collections/composition_collection";
import { ISkilltree } from "../collections/skilltree_collection"
import { getComposition, getCompositionSkilltrees, getSharedUsers, getUserResults, saveUserResults } from "../services/firestore"
import { useNavigate, useParams } from "react-router";
import { ContextStorage } from "beautiful-skill-tree/dist/models";
import { AutocompleteOption } from "../common/AutoCompleteOption.model";
import { countSelectedSkills } from "../common/StandardFunctions";

export function SkillTreeViewer() {
    // hook to display custom snackbars
    const snackbarController = useSnackbarController();
    const navigate = useNavigate();
    const backToOverview = () => {
        navigate(-1);
    }
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
    const initialAutocompleteOption: AutocompleteOption = { id: authController.user?.uid || "", label: authController.user?.displayName || "" };
    const [selectedUser, setSelectedUser] = useState<AutocompleteOption | null>(initialAutocompleteOption);
    const [data, setData] = useState<SavedDataType[]>([]);
    const [skillCount, setSkillCount] = useState<number>(0);
    const [selectedSkillCount, setSelectedSkillCount] = useState<number>(0);

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
            const config = await storageSource.getDownloadURL(composition.backgroundImage);
            url = config.url;
        }
        const [skilltrees, skillCount, error2] = await getCompositionSkilltrees(id);
        if (error2) return handleError(error2);
        const [labels, error3] = await getSharedUsers(id);
        if (error3) return handleError(error3);
        const [data, error4] = await getUserResults(authController.user?.uid, skilltrees)
        if (error4) return handleError(error4);
        if (labels) setUsers(labels);
        if (url) setUrl(url);
        if (data) {
            const selectedCount = countSelectedSkills(data);
            setSelectedSkillCount(selectedCount);
            setData(data);
        }
        if (skillCount) setSkillCount(skillCount);
        setSkilltreeList(skilltrees || []);
        setComposition(composition);
        setIsOwner(composition?.user === authController.user?.uid);
        setIsLoading(false);
    }

    useEffect(() => {
        initialize();
    }, [])

    const getData = async (user: AutocompleteOption | null = null, list: ISkilltree[] = [], setLoadingIndicator = false) => {
        if (setLoadingIndicator) setIsLoading(true);
        if (user && list.length > 0) {
            const [data, error4] = await getUserResults(user.id, list)
            if (error4) handleError(error4);
            if (data) setData(data);
            if (setLoadingIndicator) setIsLoading(false);
        } else if (list.length > 0) {
            setTimeout(() => {
                setData([]);
                if (setLoadingIndicator) setIsLoading(false);
            }, 100)
        }
    }

    useEffect(() => {
        getData(selectedUser, skilltreesList, true);
    }, [selectedUser])

    const handleSave = async (storage: ContextStorage, treeId: string, skills: SavedDataType) => {
        if (isLoading || !selectedUser) return;
        const canSave = authController.user?.uid === composition?.user || composition?.loggedInUsersCanEdit;
        if (!canSave) return handleError("Please ask your instructor to update the completion status of this skill. Changes will not be saved.");
        const error = await saveUserResults(authController.user?.uid, treeId, composition?.id, skills, 0);
        if (error) return handleError(error, false);
        const index = skilltreesList.findIndex(st => st.id === treeId);
        data[index] = skills;
        const selectedSkillCount = countSelectedSkills(data);
        setSelectedSkillCount(selectedSkillCount);
    }

    return (
        <Box style={{ backgroundImage: `url(${url})`, backgroundPosition: 'center', backgroundSize: 'cover', backgroundRepeat: 'no-repeat', minHeight: '100%' }}>
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
                            {({ handleFilter }) => (
                                <React.Fragment>
                                    <Card sx={{ minWidth: 275, marginTop: 2, maxHeight: 275 }}>
                                        <CardContent>
                                            <Typography variant="h6" component="div" sx={{ marginBottom: 3 }}>
                                                Completed skills:
                                                <span> {selectedSkillCount} / {skillCount}</span>
                                            </Typography>
                                            {isOwner &&
                                                <Autocomplete
                                                    value={selectedUser}
                                                    onChange={(event: any, newValue: AutocompleteOption | null) => {
                                                        setSelectedUser(newValue);
                                                    }}
                                                    isOptionEqualToValue={(option, value) => {
                                                        return option.id === value.id && option.label === value.label
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
                                            <Button aria-label="delete" size="small" onClick={() => backToOverview()}>
                                                Back
                                            </Button>
                                        </CardActions>
                                    </Card>
                                    {skilltreesList.map((skilltree, index) => (
                                        <SkillTree
                                            key={skilltree.id}
                                            treeId={skilltree.id || ""}
                                            title={skilltree.title}
                                            data={skilltree.data}
                                            collapsible={skilltree.collapsible}
                                            description={skilltree.description}
                                            handleSave={handleSave}
                                            savedData={data[index]}
                                        />))}
                                </React.Fragment>
                            )}
                        </SkillTreeGroup>
                    </SkillProvider>
                }
            </Container>
        </Box>
    );
}