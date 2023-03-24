// import React from "react";
import { Box, CircularProgress } from "@mui/material";
import { Entity } from "firecms";
import { IUser } from "../types/iuser.type";
import { Scheduler } from "@aldabil/react-scheduler";
import { EventActions, ProcessedEvent } from "@aldabil/react-scheduler/types";
import { deleteEvent, editEvent, getUserEvents } from "../services/events.service";
import { CHIP_COLORS } from "../common/StandardData";

export function UserSchedulerView({ entity, compositionId }: {
    entity: Entity<IUser> | undefined,
    compositionId: string | undefined
}) {

    const handleDelete = (deletedId: string): Promise<string> => {
        return deleteEvent(deletedId);
    };

    const handleConfirm = async (
        event: ProcessedEvent,
        action: EventActions
      ): Promise<ProcessedEvent> => {   
        return new Promise(async (res, rej) => {
            console.log(action);
          if (action === "edit") {
            const [returned, error] = await editEvent(event);
            if(error) {
                rej(error);
            } else if(!returned) {
                rej('Could not process the edit');
            } else {
                res(returned);
            }
          } else if (action === "create") {
            /**POST event to remote DB */
          }
    
          
        });
      };

    const initialize = async () => {
        if (!entity) return [];
        const [events, error] = await getUserEvents(entity.id);
        if (error) return [];
        const processedEvents = events ? events.map(e => {
            return {
                event_id: e.id,
                title: e.title,
                start: e.start.toDate(),
                end: e.end.toDate(),
                editable: e.editable,
                deletable: e.deletable,
                draggable: e.draggable,
                disabled: compositionId ? e.composition?.id !== compositionId : false,
                color: e.color ? CHIP_COLORS[e.color].color : undefined
            } as ProcessedEvent;
        }) : [];
        return processedEvents;
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

                <Box p={1}>
                    {entity ?
                        <Scheduler
                            view="week"
                            getRemoteEvents={initialize}
                            week={
                                {
                                    weekDays: [0, 1, 2, 3, 4],
                                    weekStartOn: 1,
                                    startHour: 8,
                                    endHour: 17,
                                    step: 60,
                                    navigation: true,
                                }
                            }
                            day={
                                {
                                    startHour: 8,
                                    endHour: 17,
                                    step: 60,
                                    navigation: true,
                                }
                            }
                            onDelete={handleDelete}
                            onConfirm={handleConfirm}
                        /> : <CircularProgress />}
                </Box>

            </Box>
        </Box>
    );

}