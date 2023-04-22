import { AppBar, Box, IconButton, ListItemIcon, Toolbar } from "@mui/material";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { query, where, orderBy, onSnapshot, doc, getDoc, QuerySnapshot, Unsubscribe, collection } from "firebase/firestore";
import { db } from "../services/firestore";
import { getSkillPath } from "../services/composition.service";
import { useAuthController, useSideEntityController, useSnackbarController } from 'firecms';
import { buildCommentsCollection } from '../collections/comment_collection';
import { CommentLabelViewer } from "../widgets/CommentLabelViewer";
import { IComment } from '../types/icomment.type';
import { ISkill } from "../types/iskill.type";
import { Button } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import Divider from '@mui/material/Divider';
import { BorderBottom } from "@mui/icons-material";
import { formatTimeAgo } from "../common/StandardFunctions";

export function SkillTreeComments() {
  const snackbarController = useSnackbarController();
  const sideEntityController = useSideEntityController();
  const authController = useAuthController();
  const { id } = useParams();
  const navigate = useNavigate();

  const [subscriptions, setSubscriptions] = useState<Unsubscribe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentsList, setCommentsList] = useState<IComment[]>([]);
  const [activeSkill, setActiveSkill] = useState<ISkill>();

  const handleError = (error: string) => {
    snackbarController.open({
      type: "error",
      message: error
    })
  }

  const initialize = async () => {
    const [path, error] = await getSkillPath(id || "");
    if (error || !path) throw new Error("Missing path info: " + error);
    const commentColRef = collection(db, 'comments');
    const skillRef = doc(db, path);
    const skillSnap = await getDoc(skillRef);
    const skill = skillSnap.data() as ISkill;
    setActiveSkill(skill);
    const commentQuery = query(commentColRef, where("skill", "==", skillRef), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(commentQuery, {
      next: async (snap) => {
        if (!isLoading) setIsLoading(true);
        const comments = await transformComments(snap);
        setCommentsList(comments);
        setIsLoading(false);
      },
      error: (err) => {
        handleError(err.message);
      }
    });
    setSubscriptions([...subscriptions, unsubscribe]);
  }

  const transformComments = async (snap: QuerySnapshot) => {
    const comments: IComment[] = [];
    for (const doc of snap.docs) {
      const comment: IComment = {
        path: doc.ref.path,
        id: doc.id,
        ...(doc.data() as IComment),
      };
      comments.push(comment);
    }
    return comments;
  };

  function commentNameAndTime(comment: IComment) {
    let str = comment.createdBy || "";
    if (comment.createdAt) {
      str += " - ";
      const formattedTimeAgo = formatTimeAgo(comment.createdAt.toDate());
      str += formattedTimeAgo;
    }
    return str;
  }

  useEffect(() => {
    initialize();
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe());
    }
  }, [])

  const openCommentController = () => {
    sideEntityController.open({
      path: "comments",
      collection: buildCommentsCollection(
        "edit",
        authController.user?.displayName,
        activeSkill?.composition,
        activeSkill?.skilltree,
        activeSkill?.id
      )
    });
  }

  return (

    <Box
      display="flex"
      width={"100%"}
      height={"100%"}
      flexDirection={"column"}>
      <AppBar sx={{ position: "relative", width: "100%", height: "10%", justifyContent: "center" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate("/compositions/" + activeSkill?.composition + "/viewer")}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h5" component="div">
            {activeSkill?.title}
          </Typography>
          <Button autoFocus variant="contained" color="primary" onClick={() => openCommentController()}>
            Add Comment
          </Button>
        </Toolbar>
      </AppBar>
      
      <List>
        {commentsList.length === 0 && <ListItem key={0}><ListItemText primary="No comments yet" secondary="Click add comment to start the thread"></ListItemText></ListItem>}
        {commentsList.map(comment => (
          <ListItem key={comment.id} divider={true} sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <ListItemText primary={comment.comment} secondary={commentNameAndTime(comment)} />
            <ListItemIcon>
              {comment.labels?.map((label) => (
                <CommentLabelViewer key={label} label={label} viewAsChip={true} />
              ))
              }
            </ListItemIcon>
          </ListItem>
        ))}
      </List>
    </Box>
  );

}