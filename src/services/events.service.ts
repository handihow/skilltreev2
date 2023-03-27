import { collection, doc, getDocs, query, where, addDoc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { createDocRef, db } from "./firestore";
import { IEvent } from "../types/ievent.type";
import { ProcessedEvent } from "@aldabil/react-scheduler/types";

export const getUserEvents = async (userId: string): Promise<[IEvent[] | [], string | null]> => {
    const studentRef = createDocRef("users/" + userId);
    const eventColRef = collection(db, 'events');
    const eventsQuery = query(eventColRef, where("students", "array-contains", studentRef));
    try {
        const snap = await getDocs(eventsQuery);
        const events = snap.docs.map(d => {
            return { id: d.id, ...d.data() } as IEvent;
        })
        return [events, null];
    } catch (e: any) {
        return [[], e.message as string];
    }
}

export const addEvent = async (processedEvent: ProcessedEvent, compositionId: string, studentIds: string[], teacherId: string): Promise<[ProcessedEvent | null, string | null]> => {
    const eventColl = collection(db, 'events');
    const compositionDoc = compositionId.length > 0 ? doc(db, "compositions/" + compositionId) : null;
    const studentDocs = studentIds.map((studentId: string) => doc(db, "users/" + studentId));
    const teacherDoc = doc(db, "users/" + teacherId);
    try {
        const docRef = await addDoc(eventColl, {
            title: processedEvent.title,
            start: Timestamp.fromDate(processedEvent.start),
            end: Timestamp.fromDate(processedEvent.end),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            composition: compositionDoc,
            students: studentDocs,
            teacher: teacherDoc,
            plannedForGroup: studentDocs.length > 1
        });
        const processed: ProcessedEvent = {
            ...processedEvent,
            event_id: docRef.id
        }
        return [processed, null];
    } catch (e: any) {
        return [null, e.message as string]
    }
}


export const editEvent = async (processedEvent: ProcessedEvent): Promise<[ProcessedEvent | null, string | null]> => {
    const eventDoc = doc(db, 'events/' + processedEvent.event_id);
    console.log(processedEvent);
    try {
        updateDoc(eventDoc, {
            title: processedEvent.title,
            start: Timestamp.fromDate(processedEvent.start),
            end: Timestamp.fromDate(processedEvent.end),
            updatedAt: Timestamp.now(),
        });
        return [processedEvent, null];
    } catch (e: any) {
        return [null, e.message as string]
    }
}

export const deleteEvent = async (eventId: string): Promise<string> => {
    const eventDoc = doc(db, 'events/' + eventId);
    try {
        deleteDoc(eventDoc);
        return eventId;
    } catch (e: any) {
        return e.message as string;
    }
}

