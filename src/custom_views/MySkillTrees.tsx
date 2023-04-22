import { useEffect, useState } from "react";
import {
    Box,
    Button,
    IconButton,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    CircularProgress,
    Container,
    Grid,
    Typography,
    Tooltip
} from "@mui/material";

import {
    useAuthController,
    useModeController,
    useSideEntityController,
    useSnackbarController,
} from "firecms";

import { db, storage } from "../services/firestore";
import { addComposition, deleteComposition, copyComposition } from "../services/composition.service";

import { useNavigate } from "react-router-dom";
import { buildShareRequestCollection } from "../collections/share_request_collection";
import { collection, query, where, orderBy, onSnapshot, Unsubscribe } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { addOrRemovePendingApprovalUser, addOrRemoveSharedUser, getStudentGroupReferences } from "../services/user.service";
import PreviewIcon from '@mui/icons-material/Preview';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import { IComposition } from "../types/icomposition.type";
import AlertDialog from "../widgets/AlertDialog";
/**
 * Sample CMS view not bound to a collection, customizable by the developer
 * @constructor
 */
export function MySkillTreesView({ view }: { view: "owned" | "shared" }) {

    // hook to display custom snackbars
    const snackbarController = useSnackbarController();
    const navigate = useNavigate();
    const modeController = useModeController();

    const navigateToSkillTree = (id: string, view: "viewer" | "editor" | "share") => {
        navigate("/compositions/" + id + '/' + view);
    }
    // hook to open the side dialog that shows the entity forms
    const sideEntityController = useSideEntityController();

    // hook to do operations related to authentication
    const authController = useAuthController();

    const initialList: IComposition[] = []
    const [compositionsList, setCompositionList] = useState(initialList);
    const [pendingApprovalList, setPendingApprovalList] = useState(initialList);
    const [groupList, setGroupList] = useState(initialList);
    const [subscriptions, setSubscriptions] = useState<Unsubscribe[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const handleError = (error: string, setLoading = true) => {
        snackbarController.open({
            type: "error",
            message: "Could not retrieve your compositions: " + error
        })
        if (setLoading) setIsLoading(false)
    }

    const initialize = async (initializer: "owned" | "shared" | "pending" | "student") => {
        if (!authController.user) return;
        const skillTreeColRef = collection(db, 'compositions');
        let skillTreeQuery;
        switch (initializer) {
            case "owned":
                skillTreeQuery = query(skillTreeColRef, where("user", "==", authController.user.uid), orderBy("lastUpdate", "desc"));
                break;
            case "shared":
                skillTreeQuery = query(skillTreeColRef, where("sharedUsers", "array-contains", authController.user.uid), orderBy("lastUpdate", "desc"))
                break;
            case "pending":
                skillTreeQuery = query(skillTreeColRef, where("pendingApprovalUsers", "array-contains", authController.user.uid), orderBy("lastUpdate", "desc"))
                break;
            case "student":
                const [refs, _error] = await getStudentGroupReferences(authController.user?.uid, authController.extra?.organization);
                skillTreeQuery = query(skillTreeColRef, where("groups", "array-contains-any", refs), orderBy("lastUpdate", "desc"))
                break;
            default:
                skillTreeQuery = query(skillTreeColRef, where("user", "==", authController.user.uid), orderBy("lastUpdate", "desc"));
                break;
        }
        const unsubscribe = onSnapshot(skillTreeQuery, {
            next: async (snap) => {
                const compositions: IComposition[] = []
                for (const value of snap.docs) {
                    let composition: IComposition = { id: value.id, ...value.data() as IComposition };
                    if (composition.backgroundImage) {
                        const resized = composition.backgroundImage.split(".")[0] + "_500x500." + composition.backgroundImage.split(".")[1];
                        try {
                            const reference = ref(storage, resized);
                            composition.url = await getDownloadURL(reference);
                        } catch (e) {
                            console.log(e);
                            composition.url = "https://via.placeholder.com/360x254.png?text=Skilltree"
                        }
                    } else {
                        composition.url = "https://via.placeholder.com/360x254.png?text=Skilltree"
                    }
                    composition.isGroupStudent = initializer === "student";
                    composition.pendingApproval = initializer === "pending";
                    compositions.push(composition);
                }
                if (initializer === "pending") {
                    setPendingApprovalList(compositions || []);
                } else if (initializer === "student") {
                    setGroupList(compositions || []);
                } else {
                    setCompositionList(compositions || []);
                }
                setIsLoading(false);
            },
            error: (error) => {
                handleError(error.message);
                setIsLoading(false);
            }
        });
        setSubscriptions([...subscriptions, unsubscribe])
    }

    useEffect(() => {
        initialize(view);
        if (view === "shared") initialize("pending");
        if (view === "shared" && authController.extra?.organization && authController.extra?.roles.includes("student")) initialize("student");
        return () => {
            subscriptions.forEach(unsubscribe => unsubscribe());
        }
    }, [])

    const add = async () => {
        if (!authController.user) return;
        setIsLoading(true);
        const error = await addComposition(authController.user.uid, authController.user.email || "")
        if (error) return handleError(error);
    };

    const addShared = () => {
        if (!authController.user) return handleError("You must be logged in to add shared compositions", false);
        sideEntityController.open({
            path: "share_requests",
            collection: buildShareRequestCollection("requesting", authController.user),
        })
    }

    const del = async ({ id }: { id: string }) => {
        setIsLoading(true);
        const error = await deleteComposition(id);
        if (error) return handleError(error);
    }

    const copy = ({ id }: { id: string }) => {
        const composition = compositionsList.find(c => c.id === id);
        if (!composition || !authController.user) return;
        copyComposition(composition, authController.user.uid, authController.user.email || "");
    }

    const removeSharedComposition = async ({ id, pendingApproval }: { id: string, pendingApproval: boolean }) => {
        if (!authController.user) return;
        setIsLoading(true);
        if (pendingApproval) {
            const error = await addOrRemovePendingApprovalUser(authController.user.uid, id, false)
            if (error) return handleError(error);
        } else {
            const error = await addOrRemoveSharedUser(authController.user.uid, id, false)
            if (error) return handleError(error);
        }

    }

    return (
        <Box
            width={"100%"}
            height={"100%"}>

            <Box m="auto"
                display="flex"
                flexDirection={"column"}
                alignItems={"center"}
                justifyItems={"center"}
            >


                <Container maxWidth={"lg"}
                    sx={{
                        my: 4,
                    }}>
                    {isLoading ? <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <CircularProgress />
                    </div> :

                        <Grid container rowSpacing={5} columnSpacing={2}>
                            <Grid item xs={12} sm={4} >
                                <Card variant="outlined" sx={{ height: "100%", cursor: 'pointer' }} onClick={view === "owned" ? add : addShared}>
                                    <CardMedia
                                        component="img"
                                        height="194"
                                        image={"https://cdn.pixabay.com/photo/2018/11/13/21/44/instagram-3814061_1280.png"}
                                        alt="add skilltree"
                                    />
                                    <CardContent>
                                        <Typography gutterBottom variant="h6" component="div">
                                            Add {view === "owned" ? "New" : "Shared"} SkillTree
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button onClick={view === "owned" ? add : addShared} color={modeController.mode === "dark" ? "secondary" : "primary"}>
                                            Add
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>

                            {compositionsList.concat(pendingApprovalList).concat(groupList).map(composition => (
                                <Grid item xs={12} sm={4} key={composition.id}>
                                    <Card variant="outlined" sx={{ height: "100%" }}>
                                        <CardMedia
                                            component="img"
                                            height="194"
                                            image={composition.url}
                                            alt={composition.title}
                                        />
                                        <CardContent>
                                            <Typography gutterBottom variant="h6" component="div">
                                                {composition.title}
                                            </Typography>
                                            {composition.pendingApproval && <Typography component="div">Pending approval</Typography>}
                                        </CardContent>
                                        <CardActions>
                                            {<Tooltip
                                                title="SkillTree Viewer">
                                                <IconButton onClick={() => navigateToSkillTree(composition.id || '', "viewer")} disabled={composition.pendingApproval}>
                                                    <PreviewIcon />
                                                </IconButton>
                                            </Tooltip>}
                                            {view === "owned" &&
                                                <Tooltip
                                                    title="SkillTree Editor">
                                                    <IconButton onClick={() => navigateToSkillTree(composition.id || '', "editor")}>
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>}
                                            {(view === "owned" || composition.canCopy) &&
                                                <Tooltip
                                                    title="Copy SkillTree">
                                                    <IconButton onClick={() => copy({ id: composition.id || '' })}>
                                                        <ContentCopyIcon />
                                                    </IconButton>
                                                </Tooltip>}
                                            {(view === "owned") &&
                                                <Tooltip
                                                    title="Share SkillTree">
                                                    <IconButton onClick={() => navigateToSkillTree(composition.id || '', "share")}>
                                                        <ShareIcon />
                                                    </IconButton>
                                                </Tooltip>}
                                            {!composition.isGroupStudent && <AlertDialog
                                                agreeFunction={view === "owned" ? del : removeSharedComposition}
                                                functionParams={{ id: composition?.id || "", pendingApproval: composition.pendingApproval }}
                                                agreeBtnText="Yes, delete!"
                                                openBtnText="icon"
                                                alertWarning="Are you sure that you want to delete?"
                                                btnColor="error"
                                            />}
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}

                        </Grid>
                    }
                </Container>

            </Box>
        </Box>
    );
}