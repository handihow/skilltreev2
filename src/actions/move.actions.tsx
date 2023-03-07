import { Button } from "@mui/material";
import {
    CollectionActionsProps,
} from "firecms";
import { updateOrder } from "../services/firestore";

export function MoveUpAction({ selectionController, loadedEntities }: CollectionActionsProps) {

    const moveUp = () => {
        const selectedId = selectionController?.selectedEntities[0]?.id;
        const index = loadedEntities.findIndex(e => e.id === selectedId);
        if(index > 0) {
            updateOrder(loadedEntities[index].path + "/" + loadedEntities[index].id, index - 1);
            updateOrder(loadedEntities[index - 1].path  + "/" + loadedEntities[index - 1].id, index);
        }
    }

    return (
        <Button onClick={moveUp} color="primary" disabled={selectionController?.selectedEntities?.length !== 1}>
            Move up
        </Button>
    );

}

export function MoveDownAction({ selectionController, loadedEntities }: CollectionActionsProps) {

    const moveDown = () => {
        const selectedId = selectionController?.selectedEntities[0]?.id;
        const index = loadedEntities.findIndex(e => e.id === selectedId);
        if(index < loadedEntities.length - 1) {
            updateOrder(loadedEntities[index].path + "/" + loadedEntities[index].id, index + 1);
            updateOrder(loadedEntities[index + 1].path  + "/" + loadedEntities[index + 1].id, index);
        }
    }

    return (
        <Button onClick={moveDown} color="primary" disabled={selectionController?.selectedEntities?.length !== 1}>
            Move down
        </Button>
    );

}