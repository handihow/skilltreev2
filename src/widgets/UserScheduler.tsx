// import React from "react";
import { Box, IconButton } from "@mui/material";
import { useAuthController } from "firecms";
import { Scheduler } from "@aldabil/react-scheduler";
import { EventActions, ProcessedEvent } from "@aldabil/react-scheduler/types";
import { addEvent, deleteEvent, editEvent, getUserEvents } from "../services/events.service";
import { CHIP_COLORS } from "../common/StandardData";
import { createEvent, EventAttributes } from 'ics';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

export function UserScheduler({ userId, compositionId }: {
    userId: string,
    compositionId: string | undefined
}) {

    const authController = useAuthController();

    const handleDelete = (deletedId: string): Promise<string> => {
        return deleteEvent(deletedId);
    };

    const handleConfirm = async (
        event: ProcessedEvent,
        action: EventActions
    ): Promise<ProcessedEvent> => {
        return new Promise(async (res, rej) => {
            if (action === "edit") {
                const [returned, error] = await editEvent(event);
                if (error) {
                    rej(error);
                } else if (!returned) {
                    rej('Could not process the edit');
                } else {
                    res(returned);
                }
            } else if (action === "create") {
                const [returned, error] = await addEvent(event, compositionId || "", [userId], authController.user?.uid || "");
                if (error) {
                    rej(error);
                } else if (!returned) {
                    rej('Could not process the addition');
                } else {
                    res(returned);
                }
            }
        });
    };

    const initialize = async () => {
        const [events, error] = await getUserEvents(userId);
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

    const downloadToICS = async (event: ProcessedEvent) => {
        const calendarEvent: EventAttributes = {
            start: [event.start.getFullYear(), event.start.getMonth() + 1, event.start.getDate(), event.start.getHours(), event.start.getMinutes()],
            end: [event.end.getFullYear(), event.end.getMonth() + 1, event.end.getDate(), event.end.getHours(), event.end.getMinutes()],
            title: event.title,
            uid: event.event_id.toString()
        }
        const filename = event.title + '.ics'
        const file: File = await new Promise((resolve, reject) => {
            createEvent(calendarEvent, (error, value) => {
                if (error) {
                    reject(error)
                }

                resolve(new File([value], filename, { type: 'plain/text' }))
            })
        })
        const url = URL.createObjectURL(file);

        // trying to assign the file URL to a window could cause cross-site
        // issues so this is a workaround using HTML5
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        URL.revokeObjectURL(url);
    }

    return (


        <Box p={1}>
            <Scheduler
                dialogMaxWidth="lg"
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
                viewerExtraComponent={(fields, event) => {
                    return (
                        <IconButton onClick={() => downloadToICS(event)}><FileDownloadIcon /></IconButton>
                    );
                }}
            />
        </Box>

    );

}