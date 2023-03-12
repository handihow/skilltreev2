import { useEffect, useState } from "react";
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
    CardMedia,
    CircularProgress,
    Container,
    Grid,
    Typography
} from "@mui/material";

import {
    useAuthController,
    useSideEntityController,
    useSnackbarController,
} from "firecms";

import { addComposition, addOrRemovePendingApprovalUser, addOrRemoveSharedUser, db, deleteComposition, storage } from "../services/firestore";

import { IComposition } from "../collections/composition_collection";
import AlertDialog from "./widgets/AlertDialog";
import { useNavigate } from "react-router-dom";
import { buildShareRequestCollection } from "../collections/share_request_collection";
import { collection, query, where, orderBy, onSnapshot, Unsubscribe } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";

/**
 * Sample CMS view not bound to a collection, customizable by the developer
 * @constructor
 */
export function MySkillTreesView({ view }: { view: "owned" | "shared" }) {

    // hook to display custom snackbars
    const snackbarController = useSnackbarController();
    const navigate = useNavigate();
    const viewSkillTree = (id: string) => {
        navigate("/compositions/" + id + '/viewer');
    }

    const editorSkillTree = (id: string) => {
        navigate("/compositions/" + id + '/editor');
    }

    // hook to open the side dialog that shows the entity forms
    const sideEntityController = useSideEntityController();

    // hook to do operations related to authentication
    const authController = useAuthController();

    const initialList: IComposition[] = []
    const [compositionsList, setCompositionList] = useState(initialList);
    const [pendingApprovalList, setPendingApprovalList] = useState(initialList);
    const [subscriptions, setSubscriptions] = useState<Unsubscribe[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    const handleError = (error: string, setLoading = true) => {
        snackbarController.open({
            type: "error",
            message: "Could not retrieve your compositions: " + error
        })
        if(setLoading) setIsLoading(false)
    }

    const initialize = async (initializer: "owned" | "shared" | "pending") => {
        if (!authController.user) return;
        const skillTreeColRef = collection(db, 'compositions');
        let skillTreeQuery;
        if (initializer === "owned") {
            skillTreeQuery = query(skillTreeColRef, where("user", "==", authController.user.uid), orderBy("lastUpdate", "desc"));
        } else if(initializer === "shared") {
            skillTreeQuery = query(skillTreeColRef, where("sharedUsers", "array-contains", authController.user.uid), orderBy("lastUpdate", "desc"))
        } else {
            skillTreeQuery = query(skillTreeColRef, where("pendingApprovalUsers", "array-contains", authController.user.uid), orderBy("lastUpdate", "desc"))
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
                    composition.pendingApproval = initializer === "pending";
                    compositions.push(composition);
                }
                if(initializer === "pending") {
                    setPendingApprovalList(compositions || []);
                } else {
                    setCompositionList(compositions || []);
                }
                setIsLoading(false);
            },
            error: (error) => {
                console.log(error.message);
                handleError(error.message);
                setIsLoading(false);
            }
        });
        setSubscriptions([...subscriptions, unsubscribe])
    }

    useEffect(() => {
        initialize(view);
        if(view === "shared") initialize("pending");
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
        if(!authController.user) return handleError("You must be logged in to add shared compositions", false);
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

    const removeSharedComposition = async ({ id, pendingApproval }: { id: string, pendingApproval: boolean }) => {
        if (!authController.user) return;
        setIsLoading(true);
        if(pendingApproval) {
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
                                            Add {view==="owned" ? "New" : "Shared"} SkillTree
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button onClick={view === "owned" ? add : addShared} color="primary">
                                            Add
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>

                            {compositionsList.concat(pendingApprovalList).map(composition => (
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

                                            {<Button onClick={() => viewSkillTree(composition.id || '')} disabled={composition.pendingApproval}>
                                                View
                                            </Button>}
                                            {view === "owned" && <Button onClick={() => editorSkillTree(composition.id || '')}>
                                                Edit
                                            </Button>}
                                            <AlertDialog
                                                agreeFunction={view === "owned" ? del : removeSharedComposition}
                                                functionParams={{ id: composition?.id || "", pendingApproval: composition.pendingApproval }}
                                                agreeBtnText="Yes, delete!"
                                                openBtnText="Delete"
                                                alertWarning="Are you sure that you want to delete?"
                                                btnColor="error"
                                            />
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