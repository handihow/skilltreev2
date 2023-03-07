import { Button } from "@mui/material";
import {
    CollectionActionsProps,
} from "firecms";
import { useNavigate } from "react-router";

export function ViewSkillTreeAction({ selectionController }: CollectionActionsProps) {
    const navigate = useNavigate();

    const viewSkillTree = () => {
        const selectedId = selectionController?.selectedEntities[0]?.id;
        if(!selectedId) return;
        navigate("/compositions/" + selectedId + '/viewer');
    }

    return (
        <Button onClick={viewSkillTree} color="primary" disabled={selectionController?.selectedEntities?.length !== 1}>
            View SkillTree
        </Button>
    );

}