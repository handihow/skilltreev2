import { collection, doc, getDocs, query, where, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { createDocRef, db } from "./firestore";
import { IEvent } from "../types/ievent.type";
import { ProcessedEvent } from "@aldabil/react-scheduler/types";

export const getUserEvents = async (userId: string): Promise<[IEvent[] | [], string | null]> => {
    const studentRef = createDocRef("users/" + userId);
    const eventColRef = collection(db, 'events');
    const eventsQuery = query(eventColRef, where("student", "==", studentRef));
    try {
        const snap = await getDocs(eventsQuery);
        const events = snap.docs.map(d => {
            return { id: d.id, ...d.data()} as IEvent;
        })
        return [events, null];        
    } catch (e: any) {
        return [[], e.message as string];
    }
}

export const editEvent = async (processedEvent: ProcessedEvent) : Promise<[ProcessedEvent | null, string | null]> => {
    const eventDoc = doc(db, 'events/' + processedEvent.event_id);
    try {
        updateDoc(eventDoc, {
            title: processedEvent.title,
            start: Timestamp.fromDate(processedEvent.start),
            end: Timestamp.fromDate(processedEvent.end),
            updatedAt: Timestamp.now()
        });
        return [processedEvent, null];
    } catch(e: any) {
        return [null, e.message as string]
    } 
}

export const deleteEvent = async (eventId: string): Promise<string> => {
    const eventDoc = doc(db, 'events/' + eventId);
    try {
        deleteDoc(eventDoc);
        return eventId;
    } catch(e: any) {
        return e.message as string;
    }
}

