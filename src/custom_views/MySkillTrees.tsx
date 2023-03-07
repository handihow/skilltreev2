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

import { addComposition, addOrRemoveSharedUser, deleteComposition, getCompositions } from "../services/firestore";

import { IComposition } from "../collections/composition_collection";
import AlertDialog from "./widgets/AlertDialog";
import { useNavigate } from "react-router-dom";

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

    const [isLoading, setIsLoading] = useState(true);

    const handleError = (error: string) => {
        snackbarController.open({
            type: "error",
            message: "Could not retrieve your compositions: " + error
        })
        setIsLoading(false)
    }

    const initialize = async () => {
        if (!authController.user) return;
        const [compositions, error] = await getCompositions(authController.user.uid, view);
        if (error) return handleError(error);
        setCompositionList(compositions || []);
        setIsLoading(false);
    }

    useEffect(() => {
        initialize();
    }, [])

    const add = async () => {
        if (!authController.user) return;
        setIsLoading(true);
        const error = await addComposition(authController.user.uid, authController.user.email || "")
        if (error) return handleError(error);
        initialize();
    };

    const del = async ({ id }: { id: string }) => {
        setIsLoading(true);
        const error = await deleteComposition(id);
        if (error) return handleError(error);
        initialize();
    }

    const removeSharedComposition = async ({ id }: { id: string }) => {
        if (!authController.user) return;
        setIsLoading(true);
        const error = await addOrRemoveSharedUser(authController.user.uid, id, false)
        if (error) return handleError(error);
        initialize();
    }

    return (
        <Box
            width={"100%"}
            height={"100%"}>

            <Box m="auto"
                display="flex"
                flexDirection={"column"}
                alignItems={"center"}
                justifyItems={"center"}>

                <Container maxWidth={"lg"}
                    sx={{
                        my: 4
                    }}>

                    {isLoading ? <CircularProgress /> :

                        <Grid container rowSpacing={5} columnSpacing={2}>
                            {view === "owned" && <Grid item xs={12} sm={4} >
                                <Card variant="outlined" sx={{ height: "100%", cursor: 'pointer' }} onClick={() => add()}>
                                    <CardMedia
                                        component="img"
                                        height="194"
                                        image={"https://cdn.pixabay.com/photo/2018/11/13/21/44/instagram-3814061_1280.png"}
                                        alt="add skilltree"
                                    />
                                    <CardContent>
                                        <Typography gutterBottom variant="h6" component="div">
                                            Add New SkillTree
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button onClick={() => add()} color="primary">
                                            Add
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>}

                            {compositionsList.map(composition => (
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
                                        </CardContent>
                                        <CardActions>
                                            
                                            <Button onClick={() => viewSkillTree(composition.id || '')}>
                                                View
                                            </Button>
                                            {view === "owned" && <Button onClick={() => editorSkillTree(composition.id || '')}>
                                                Edit
                                            </Button>}
                                            <AlertDialog
                                                agreeFunction={view === "owned" ? del : removeSharedComposition}
                                                functionParams={{ id: composition?.id || "" }}
                                                agreeBtnText="Yes, delete!"
                                                openBtnText="Delete"
                                                alertWarning="Are you sure that you want to delete?"
                                                btnColor="error"
                                            />
                                        </CardActions>
                                    </Card>
                                </Grid>
                            ))}

                        </Grid>}

                </Container>
            </Box>
        </Box>
    );
}