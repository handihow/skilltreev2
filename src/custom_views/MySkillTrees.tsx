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
    EntityCollection,
    useAuthController,
    useSideEntityController,
    useSnackbarController,
    useStorageSource,
} from "firecms";

import { httpsCallable } from "firebase/functions";
import { functions } from "../services/firestore";

import { simpleCompositionsCollection, IComposition } from "../collections/composition_collection";
import { db } from "../services/firestore"
import { collection, getDocs, orderBy, query, where, Timestamp, addDoc, setDoc, arrayRemove, doc, updateDoc } from "firebase/firestore";
import AlertDialog from "./widgets/AlertDialog";
import { useNavigate } from "react-router-dom";
import { standardChildSkills, standardRootSkill } from "../common/StandardData";

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

    // hook to open the side dialog that shows the entity forms
    const sideEntityController = useSideEntityController();

    // hook to do operations related to authentication
    const authController = useAuthController();

    const storageSource = useStorageSource();

    const initialList: IComposition[] = []
    const [compositionsList, setCompositionList] = useState(initialList);

    const [isLoading, setIsLoading] = useState(true);

    const loadContent = () => {
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
                        const resized = composition.backgroundImage.split(".")[0] + "_500x500." + composition.backgroundImage.split(".")[1];
                        try {
                            const config = await storageSource.getDownloadURL(resized);
                            composition.url = config.url
                        } catch (e) {
                            console.log(e);
                            composition.url = "https://via.placeholder.com/360x254.png?text=Skilltree"
                        }
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
                setIsLoading(false)
            });
    }

    useEffect(() => {
        console.log('loading content')
        loadContent();
    }, [])

    const addComposition = async () => {
        try {
            const newComposition: IComposition = {
                title: "My SkillTree",
                user: authController.user?.uid || "",
                username: authController.user?.email || "",
                hasBackgroundImage: false,
                canCopy: false,
                loggedInUsersCanEdit: true,
                loggedInUsersOnly: true,
                skillcount: 3,
                lastUpdate: Timestamp.now(),
            };
            const skillTreeColRef = collection(db, 'compositions');
            const composition = await addDoc(skillTreeColRef, newComposition);
            await updateDoc(composition, { id: composition.id });
            const newSkilltree = {
                title: "Example skilltree",
                description: "More information about my skill tree",
                collapsible: true,
                order: 0,
            };
            const skilltreeColRef = collection(db, 'compositions', composition.id, 'skilltrees');
            const skilltree = await addDoc(skilltreeColRef, newSkilltree);
            await updateDoc(skilltree, { id: skilltree.id });
            const newRootSkill = {
                skilltree: skilltree.id,
                composition: composition.id,
                ...standardRootSkill
            };
            const rootSkillColRef = collection(db, 'compositions', composition.id, 'skilltrees', skilltree.id, 'skills');
            const rootSkill = await addDoc(rootSkillColRef, newRootSkill);
            await updateDoc(rootSkill, { id: rootSkill.id })
            const childSkillColRef = collection(db, 'compositions', composition.id, 'skilltrees', skilltree.id, 'skills', rootSkill.id, 'skills');
            for (const child of standardChildSkills) {
                const childSkill = await addDoc(childSkillColRef, { skilltree: skilltree.id, composition: composition.id, ...child });
                await updateDoc(childSkill, { id: childSkill.id })
            }
            setIsLoading(true);
            loadContent();
        } catch (err) {
            snackbarController.open({
                type: "error",
                message: "Could not add skilltree: " + err
            })
            setIsLoading(false)
        }
    };

    const deleteComposition = async (id: string) => {
        setIsLoading(true);
        const path = `compositions/${id}`;
        const deleteFirestorePathRecursively = httpsCallable(
            functions,
            "deleteFirestorePathRecursively"
        );
        await deleteFirestorePathRecursively({
            collection: "Skilltree",
            path: path,
        });
        loadContent();
    }

    const removeSharedComposition = async (id: string) => {
        setIsLoading(true);
        const docRef = doc(db, 'compositions', id);
        await updateDoc(docRef, { sharedUsers: arrayRemove(authController.user?.uid) })
        loadContent();
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
                                            <Button onClick={() => viewSkillTree(composition.id || '')}>
                                                View
                                            </Button>

                                            {view === "owned" && <Button
                                                onClick={() => sideEntityController.open({
                                                    entityId: composition.id,
                                                    path: "/compositions", // this path is not mapped in our collections
                                                    collection: simpleCompositionsCollection,
                                                    width: 800
                                                })}
                                                color="primary">
                                                Edit
                                            </Button>}
                                            <AlertDialog deleteFunc={view === "owned" ? deleteComposition : removeSharedComposition} id={composition?.id || ""} />
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