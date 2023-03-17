import React, { useEffect, useState } from "react";
import {
    SkillTreeGroup,
    SkillProvider,
} from "beautiful-skill-tree";
import {
    Box,
    Card,
    CardContent,
    CircularProgress,
    Collapse,
    Container,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
} from "@mui/material";
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import {
    useAuthController, useSideEntityController, useSnackbarController, useStorageSource,
} from "firecms";
import { db, deleteFromPathRecursively } from '../services/firestore';
import { buildCompositionsCollection, IComposition } from "../collections/composition_collection";
import { skilltreesCollection } from "../collections/skilltree_collection";
import { ISkilltree } from "../collections/skilltree_collection"
import { useNavigate, useParams } from "react-router";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Unsubscribe } from "firebase/auth";
import AlertDialog from "./widgets/AlertDialog";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { SkillTreeWidget } from "./widgets/SkillTreeWidget";

export function SkillTreeEditor() {
    // hook to display custom snackbars
    const snackbarController = useSnackbarController();
    const sideEntityController = useSideEntityController();

    const navigate = useNavigate();
    const backToOverview = () => {
        navigate("/own-skilltrees");
    }
    // hook to do operations related to authentication
    const authController = useAuthController();
    const storageSource = useStorageSource();

    const [skilltreesList, setSkilltreeList] = useState<ISkilltree[]>([]);
    const [composition, setComposition] = useState<IComposition | null>(null);
    const [url, setUrl] = useState("");
    const [subscriptions, setSubscriptions] = useState<Unsubscribe[]>([]);
    const [open, setOpen] = React.useState(false);

    const handleClick = () => {
        setOpen(!open);
    };

    const [isLoading, setIsLoading] = useState(true);

    const { id } = useParams();

    const handleError = (error: string, setLoadingToFalse = true) => {
        snackbarController.open({
            type: "error",
            message: error
        })
        if (setLoadingToFalse) setIsLoading(false);
    }

    const subscribeToCompositionChanges = () => {
        if (!authController.user || !id) return;
        const compositionRef = doc(db, 'compositions/' + id);
        const unsubscribe = onSnapshot(compositionRef, {
            next: async (snap) => {
                const composition: IComposition = { id: snap.id, ...snap.data() as IComposition };
                setComposition(composition);
                if (composition?.backgroundImage) {
                    const config = await storageSource.getDownloadURL(composition.backgroundImage);
                    setUrl(config.url);
                } else if (!isLoading) {
                    setUrl("")
                }
            },
            error: (err) => {
                handleError(err.message);
            }
        });
        setSubscriptions([unsubscribe])
    }

    const subscribeToSkilltreeChanges = () => {
        if (!authController.user || !id) return;
        const skillTreeColRef = collection(db, 'compositions', id, 'skilltrees');
        const skillTreeQuery = query(skillTreeColRef, orderBy("order", "asc"));
        const unsubscribe2 = onSnapshot(skillTreeQuery, {
            next: (snap) => {
                const skilltrees: ISkilltree[] = snap.docs.map(value => {
                    return { id: value.id, ...value.data() as ISkilltree }
                });
                setSkilltreeList(skilltrees);
                setIsLoading(false);
            },
            error: (err) => {
                handleError(err.message);
            }
        })
        setSubscriptions([...subscriptions, unsubscribe2]);
    }


    useEffect(() => {
        subscribeToCompositionChanges();
        subscribeToSkilltreeChanges();
        return () => {
            subscriptions.forEach(unsubscribe => unsubscribe());
        }
    }, [])

    const openSideController = (simple: boolean) => {
        sideEntityController.open({
            entityId: composition?.id,
            path: "compositions",
            collection: buildCompositionsCollection(simple, authController.extra?.organization),
        })
    }

    const openSkilltreeController = (id?: string) => {
        sideEntityController.open({
            entityId: id,
            path: "compositions/" + composition?.id + "/skilltrees",
            collection: skilltreesCollection
        })
    }

    const deleteSkilltree = async ({ id }: { id: string }) => {
        if (!composition?.id || !id) return handleError("Delete path cannot be constructed");
        const path = "/compositions/" + composition.id + "/skilltrees/" + id;
        const error = await deleteFromPathRecursively(path, "Skilltree")
        if (error) handleError(error, false);
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
                            {() => (
                                <React.Fragment>
                                    <Card sx={{ width: '350px', marginTop: 2, alignSelf: 'flex-start' }}>
                                        <CardContent>
                                            <Typography gutterBottom variant="h6" component="div">{composition?.title}</Typography>
                                            <List component="nav" dense disablePadding>
                                                <ListItem key="composition-edit">
                                                    <ListItemButton onClick={() => openSideController(true)}>
                                                        <ListItemIcon>
                                                            <EditIcon />
                                                        </ListItemIcon>
                                                        <ListItemText primary="Edit SkillTree" />
                                                    </ListItemButton>
                                                </ListItem>
                                                <ListItem key="composition-controller">
                                                    <ListItemButton onClick={() => openSideController(false)}>
                                                        <ListItemIcon>
                                                            <SettingsIcon />
                                                        </ListItemIcon>
                                                        <ListItemText primary="Open Controller" />
                                                    </ListItemButton>
                                                </ListItem>
                                                <ListItem>
                                                    <ListItemButton onClick={handleClick}>
                                                        <ListItemIcon>
                                                            <AccountTreeIcon />
                                                        </ListItemIcon>
                                                        <ListItemText primary="Tree controls" />
                                                        {open ? <ExpandLess /> : <ExpandMore />}
                                                    </ListItemButton>
                                                </ListItem>
                                                <Collapse in={open} timeout="auto" unmountOnExit>
                                                    <List component="div" dense disablePadding>
                                                        <ListItem key="skilltree-add">
                                                            <ListItemButton onClick={() => openSkilltreeController()}>
                                                                <ListItemIcon>
                                                                    <AddIcon />
                                                                </ListItemIcon>
                                                                <ListItemText primary="Add tree" />
                                                            </ListItemButton>
                                                        </ListItem>
                                                        {skilltreesList.map((skilltree) => (
                                                            <ListItem key={skilltree.id} secondaryAction={
                                                                <AlertDialog
                                                                    agreeFunction={deleteSkilltree}
                                                                    functionParams={{ id: skilltree.id }}
                                                                    openBtnText="icon"
                                                                    agreeBtnText="Yes, delete!"
                                                                    alertWarning="This will delete the tree and all it's child skills! Do you really want to do this?"
                                                                    btnColor='error'
                                                                ></AlertDialog>
                                                            }>
                                                                <ListItemButton onClick={() => openSkilltreeController(skilltree.id)}>
                                                                    <ListItemIcon>
                                                                        <EditIcon />
                                                                    </ListItemIcon>
                                                                    <ListItemText primary={skilltree.title} />
                                                                </ListItemButton>
                                                            </ListItem>
                                                        ))}
                                                    </List>
                                                </Collapse>
                                                <ListItem key="go-back">
                                                    <ListItemButton onClick={() => backToOverview()}>
                                                        <ListItemIcon>
                                                            <ArrowBackIcon />
                                                        </ListItemIcon>
                                                        <ListItemText primary="Go back" />
                                                    </ListItemButton>
                                                </ListItem>
                                            </List>
                                        </CardContent>
                                    </Card>
                                    {skilltreesList.map((skilltree) => (
                                        <SkillTreeWidget
                                            key={skilltree.id}
                                            mode="editor"
                                            skilltree={skilltree}
                                            handleSave={undefined}
                                            selectedUser={null}
                                            handleNodeSelect={undefined}
                                            isAdmin={true}
                                        ></SkillTreeWidget>))}
                                </React.Fragment>
                            )}
                        </SkillTreeGroup>
                    </SkillProvider>
                }
            </Container>
        </Box>
    );
}