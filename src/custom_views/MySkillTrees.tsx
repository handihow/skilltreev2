import React, { useEffect, useState } from "react";
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
    useReferenceDialog,
    useSideEntityController,
    useSnackbarController,
    useStorageSource
} from "firecms";

import { simpleCompositionsCollection, IComposition } from "../collections/composition_collection";
import { db } from "../services/firestore"
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import AlertDialog from "./AlertDialog";

/**
 * Sample CMS view not bound to a collection, customizable by the developer
 * @constructor
 */
export function MySkillTreesView({ view }: { view: "owned" | "shared" }) {

    // hook to display custom snackbars
    const snackbarController = useSnackbarController();

    // hook to open the side dialog that shows the entity forms
    const sideEntityController = useSideEntityController();

    // hook to do operations related to authentication
    const authController = useAuthController();

    const storageSource = useStorageSource();

    const initialList: IComposition[] = []
    const [compositionsList, setCompositionList] = useState(initialList);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!authController.user) return;
        const skillTreeColRef = collection(db, 'compositions');
        let skillTreeQuery;
        if (view === "owned") {
            skillTreeQuery = query(skillTreeColRef, where("user", "==", authController.user.uid), orderBy("lastUpdate", "desc"));
        } else {
            skillTreeQuery = query(skillTreeColRef, where("sharedUsers", "array-contains", authController.user.uid), orderBy("lastUpdate", "desc"))
        }
        getDocs(skillTreeQuery)
            .then(async (values) => {
                const compositions: IComposition[] = []
                for (const value of values.docs) {
                    let composition: IComposition = { id: value.id, ...value.data() as IComposition };
                    if (composition.backgroundImage) {
                        const config = await storageSource.getDownloadURL(composition.backgroundImage);
                        composition.url = config.url
                    } else {
                        composition.url = "https://via.placeholder.com/360x254.png?text=Skilltree"
                    }
                    compositions.push(composition);
                }
                setCompositionList(compositions);
                setIsLoading(false);
            })
            .catch((err) => {
                snackbarController.open({
                    type: "error",
                    message: "Could not retrieve your compositions: " + err.message
                })
            });
    })

    const addComposition = () => {
        console.log('Adding');
    }

    const deleteComposition = (composition: IComposition) => {
        console.log(composition)
        window.alert("Are you sure you want to delete?")
    }

    return (
        <Box
            display="flex"
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
                            {view === "owned" && <Grid item xs={12} sm={4} key={"add"}>
                                <Card variant="outlined" sx={{ height: "100%", cursor: 'pointer' }} onClick={() => addComposition()}>
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
                                        <Button onClick={() => addComposition()} color="primary">
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
                                            {view === "owned" && <Button>
                                                Editor
                                            </Button>}
                                            <Button>
                                                View
                                            </Button>
                                            <Button
                                                onClick={() => sideEntityController.open({
                                                    entityId: composition.id,
                                                    path: "/compositions", // this path is not mapped in our collections
                                                    collection: simpleCompositionsCollection,
                                                    width: 800
                                                })}
                                                color="primary">
                                                Edit
                                            </Button>
                                            <AlertDialog />
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