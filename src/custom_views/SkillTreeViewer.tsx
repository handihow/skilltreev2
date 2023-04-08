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
    useAuthController, useModeController, useSideEntityController, useSnackbarController, useStorageSource,
} from "firecms";
import { useNavigate, useParams } from "react-router";
import { AutocompleteOption } from "../types/autoCompleteOption.type";
import { getComposition, getCompositionSkilltrees } from "../services/composition.service";
import { getEvaluationModel } from "../services/evaluation.service";
import { getSharedUsers, saveUserResults } from "../services/user.service";
import { ViewerContext } from "../context/ViewerContext";
import { IComposition } from "../types/icomposition.type";
import { IEvaluationModel } from "../types/ievaluation.model.type";
import { ISkilltree } from "../types/iskilltree.type";
import AlertDialog from "../widgets/AlertDialog";
import { SkillTreeWidget } from "../widgets/SkillTreeWidget";
import { collection, onSnapshot, query, Unsubscribe, where } from "firebase/firestore";
import { createDocRef, db } from "../services/firestore";
import { IEvaluation } from "../types/ievaluation.type";
import { IEvent } from "../types/ievent.type";
import { buildUsersCollection } from "../collections/user/user_collection";

export function SkillTreeViewer() {
    // hook to display custom snackbars
    const snackbarController = useSnackbarController();
    const navigate = useNavigate();
    // hook to do operations related to authentication
    const authController = useAuthController();
    const storageSource = useStorageSource();
    const modeController = useModeController();
    const sideEntityController = useSideEntityController();

    const initialList: ISkilltree[] = []
    const [skilltreesList, setSkilltreeList] = useState(initialList);
    const [composition, setComposition] = useState<IComposition | null>(null);
    const [url, setUrl] = useState("");
    const [evaluationModel, setEvaluationModel] = useState<IEvaluationModel | null>(null);
    const [evaluations, setEvaluations] = useState<IEvaluation[]>([]);
    const [events, setEvents] = useState<IEvent[]>([]);
    const [subscriptions, setSubscriptions] = useState<Unsubscribe[]>([]);

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
        if (!composition) return handleError("Could not find the composition");
        let url = '';
        if (composition.backgroundImage) {
            try {
                const config = await storageSource.getDownloadURL(composition.backgroundImage);
                url = config.url;
            } catch (e) {
                console.log(e);
            }
        }
        if (composition.evaluationModel) {
            const [evaluationModel, _error2] = await getEvaluationModel(composition.evaluationModel);
            if (evaluationModel) setEvaluationModel(evaluationModel);

        }
        const [skilltrees, error3] = await getCompositionSkilltrees(id);
        if (error3) return handleError(error3);
        const [labels, error4] = await getSharedUsers(id, authController.user.uid);
        if (error4) return handleError(error4);
        if (labels?.length) {
            setUsers([...labels]);
            setSelectedUser(labels[0]);
        };
        if (url) setUrl(url);
        setSkilltreeList(skilltrees || []);
        setComposition(composition);
        setIsLoading(false);
    }

    useEffect(() => {
        initialize();
    }, [])

    const subscribeToEvaluations = () => {
        const evaluationColRef = collection(db, 'evaluations');
        const compositionRef = createDocRef("compositions/" + id);
        if (!selectedUser)
            return setEvaluations([])
        const studentRef = createDocRef("users/" + selectedUser.id);
        const evaluationQuery = query(evaluationColRef, where("student", "==", studentRef), where("composition", "==", compositionRef));
        const unsubscribe = onSnapshot(evaluationQuery, {
            next: (snap) => {
                const evaluations = snap.docs.map((doc) => {
                    return { id: doc.id, ...doc.data() } as IEvaluation;
                });
                setEvaluations(evaluations);
            },
            error: (error) => {
                snackbarController.open({
                    type: "error",
                    message: error.message
                })
            }
        });
        return unsubscribe;
    }

    const subscribeToEvents = () => {
        const eventColRef = collection(db, 'events');
        const compositionRef = createDocRef("compositions/" + id);
        let eventsQuery = query(eventColRef, where("plannedForGroup", "==", true), where("composition", "==", compositionRef));
        if (selectedUser) {
            const studentRef = createDocRef("users/" + selectedUser.id);
            eventsQuery = query(eventColRef, where("students", "array-contains", studentRef), where("composition", "==", compositionRef));
        };
        const unsubscribe = onSnapshot(eventsQuery, {
            next: (snap) => {
                const events = snap.docs.map((doc) => {
                    return { id: doc.id, ...doc.data() } as IEvent;
                });
                setEvents(events);
            },
            error: (error) => {
                snackbarController.open({
                    type: "error",
                    message: error.message
                })
            }
        });
        return unsubscribe;
    }

    useEffect(() => {
        const unsubscribe = subscribeToEvents();
        const unsubscribe2 = subscribeToEvaluations();
        setSubscriptions(unsubscribe2 ? [...subscriptions, unsubscribe, unsubscribe2] : [...subscriptions, unsubscribe]);
        return () => {
            subscriptions.forEach(unsubscribe => unsubscribe());
        }
    }, [selectedUser])

    const { user, extra: { roles = [] } } = authController;
    const isAdmin = user?.uid === composition?.user || roles.includes("admin") || roles.includes("super");

    const handleSave = async (treeId: string, skills: SavedDataType) => {
        if (isLoading || !user || !composition || !selectedUser) return;
        const canSave = isAdmin || composition?.loggedInUsersCanEdit;
        if (!canSave) return handleError("Please ask your instructor to update the completion status of this skill. Changes will not be saved.");
        const error = await saveUserResults(selectedUser.id, treeId, composition?.id, skills, 0);
        if (error) return handleError(error, false);
    }

    const openUserRecord = () => {
        sideEntityController.open({
            entityId: selectedUser?.id,
            path: "users",
            collection: buildUsersCollection("teacher", undefined, composition?.id)
        })
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
                    <ViewerContext.Provider value={{
                        mode: isAdmin ? "teacher" : "student",
                        composition,
                        evaluationModel,
                        selectedUser,
                        users,
                        evaluations,
                        events
                    }}>
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
                                                        disableClearable={users.length < 2}
                                                        id="combo-box-demo"
                                                        options={users}
                                                        sx={{ width: 300 }}
                                                        renderInput={(params) => <TextField {...params} label="User results" />}
                                                    />
                                                }
                                                {!selectedUser && <Typography variant="label">Todo planning applies to entire group</Typography>}
                                                <TextField sx={{ width: 300, marginTop: 3 }} id="text-field" label="Filter skills" onChange={(event: any) => handleFilter(event.target.value || "")} />
                                            </CardContent>
                                            <CardActions>
                                                {isAdmin && <AlertDialog
                                                    agreeFunction={resetSkills}
                                                    functionParams={undefined}
                                                    agreeBtnText="Yes, reset!"
                                                    openBtnText="Reset"
                                                    alertWarning="Are you sure that you want to reset the completion status of all skills?"
                                                    btnColor="error"
                                                />}
                                                <Button color={modeController.mode === "dark" ? "secondary" : "primary"}
                                                    aria-label="delete" size="small" onClick={() => isAdmin ? navigate("/own-skilltrees") : navigate("/shared-skilltrees")}>
                                                    Back
                                                </Button>
                                                {isAdmin && selectedUser && <Button color={modeController.mode === "dark" ? "secondary" : "primary"}
                                                    onClick={openUserRecord}>User record</Button>}
                                                {composition?.pendingApprovalUsers?.length && composition.pendingApprovalUsers.length > 0 ?
                                                    <Button color={modeController.mode === "dark" ? "secondary" : "primary"}
                                                        onClick={() => navigate("/share_requests/" + id)}>Approvals</Button> : <React.Fragment></React.Fragment>}
                                            </CardActions>
                                        </Card>
                                        {skilltreesList.map((skilltree) => (
                                            <SkillTreeWidget
                                                key={skilltree.id}
                                                skilltree={skilltree}
                                                handleSave={handleSave}
                                            ></SkillTreeWidget>
                                        ))}
                                    </React.Fragment>
                                )}
                            </SkillTreeGroup>
                        </SkillProvider>
                    </ViewerContext.Provider>
                }
            </Container>
        </Box>
    );
}