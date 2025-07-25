import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    onSnapshot,
    query,
    where,
    orderBy,
    writeBatch,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore';
import { db } from './firebase';
import {
    FirestoreUser,
    FirestoreWorkspace,
    FirestoreBoard,
    FirestoreTask,
    FirestoreTemplate
} from '@/types/firestore';

// Collections
const USERS = 'users';
const WORKSPACES = 'workspaces';
const BOARDS = 'boards';
const TASKS = 'tasks';
const TEMPLATES = 'templates';

export class FirestoreService {
    // ===============================
    // USER OPERATIONS
    // ===============================

    static async createUser(userId: string, userData: Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
        const userRef = doc(db, USERS, userId);
        await setDoc(userRef, {
            ...userData,
            id: userId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
    }

    static async createUserIfNotExists(userId: string, userData: Omit<FirestoreUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
        // Validate inputs
        if (!userId || typeof userId !== 'string' || userId.trim() === '') {
            console.error('Invalid userId provided to createUserIfNotExists:', userId);
            return;
        }

        if (!db) {
            console.error('Firestore db instance is not initialized');
            return;
        }

        try {
            const userRef = doc(db, USERS, userId);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                await setDoc(userRef, {
                    ...userData,
                    id: userId,
                    workspaces: [], // Initialize empty workspaces array
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            } else {
                console.log('User document already exists');
            }
        } catch (error) {
            console.error('Error in createUserIfNotExists:', error);
            // Don't throw - we don't want to break the auth flow
        }
    }

    static async getUser(userId: string): Promise<FirestoreUser | null> {
        const userRef = doc(db, USERS, userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            const data = userSnap.data();
            return {
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as FirestoreUser;
        }
        return null;
    }

    // ===============================
    // WORKSPACE OPERATIONS
    // ===============================

    static async createWorkspace(workspaceData: Omit<FirestoreWorkspace, 'id' | 'createdAt' | 'updatedAt' | 'memberUserIds'>): Promise<string> {
        // Extract memberUserIds from members array
        const memberUserIds = workspaceData.members.map(member => member.userId);

        const workspaceRef = await addDoc(collection(db, WORKSPACES), {
            ...workspaceData,
            memberUserIds,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return workspaceRef.id;
    }

    static async createDefaultWorkspaceForUser(userId: string, userName: string): Promise<string> {
        const workspaceData = {
            name: `${userName}'s Workspace`,
            ownerId: userId,
            members: [{
                userId: userId,
                role: 'owner' as const,
                joinedAt: new Date()
            }]
        };

        return await this.createWorkspace(workspaceData);
    }

    static async getWorkspace(workspaceId: string): Promise<FirestoreWorkspace | null> {
        const workspaceRef = doc(db, WORKSPACES, workspaceId);
        const workspaceSnap = await getDoc(workspaceRef);
        if (workspaceSnap.exists()) {
            const data = workspaceSnap.data();
            return {
                ...data,
                id: workspaceId,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as FirestoreWorkspace;
        }
        return null;
    }

    static async getUserWorkspaces(userId: string): Promise<FirestoreWorkspace[]> {

        if (!userId) {
            console.error('❌ No userId provided to getUserWorkspaces');
            return [];
        }

        try {
            const workspacesRef = collection(db, WORKSPACES);
            const q = query(
                workspacesRef,
                where('memberUserIds', 'array-contains', userId)
            );

            const querySnapshot = await getDocs(q);

            const workspaces = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            })) as FirestoreWorkspace[];

            return workspaces;
        } catch (error) {
            console.error('❌ Error in getUserWorkspaces:', error);
            return [];
        }
    }

    // ===============================
    // BOARD OPERATIONS
    // ===============================

    static async createBoard(boardData: Omit<FirestoreBoard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const boardRef = await addDoc(collection(db, BOARDS), {
            ...boardData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return boardRef.id;
    }

    static async getBoard(boardId: string): Promise<FirestoreBoard | null> {
        const boardRef = doc(db, BOARDS, boardId);
        const boardSnap = await getDoc(boardRef);
        if (boardSnap.exists()) {
            const data = boardSnap.data();
            return {
                ...data,
                id: boardId,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as FirestoreBoard;
        }
        return null;
    }

    static async getWorkspaceBoards(workspaceId: string): Promise<FirestoreBoard[]> {
        const boardsRef = collection(db, BOARDS);
        const q = query(boardsRef, where('workspaceId', '==', workspaceId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        })) as FirestoreBoard[];
    }

    static async updateBoard(boardId: string, updates: Partial<FirestoreBoard>): Promise<void> {
        const boardRef = doc(db, BOARDS, boardId);
        await updateDoc(boardRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    }

    // ===============================
    // TASK OPERATIONS
    // ===============================

    static async createTask(taskData: Omit<FirestoreTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const taskRef = await addDoc(collection(db, TASKS), {
            ...taskData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return taskRef.id;
    }

    static async getBoardTasks(boardId: string): Promise<FirestoreTask[]> {
        const tasksRef = collection(db, TASKS);
        const q = query(
            tasksRef,
            where('boardId', '==', boardId),
            orderBy('position')
        );
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        })) as FirestoreTask[];
    }

    static async updateTask(taskId: string, updates: Partial<FirestoreTask>): Promise<void> {
        const taskRef = doc(db, TASKS, taskId);
        await updateDoc(taskRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    }

    static async deleteTask(taskId: string): Promise<void> {
        const taskRef = doc(db, TASKS, taskId);
        await deleteDoc(taskRef);
    }

    static async moveTask(taskId: string, newColumnId: string, newPosition: number): Promise<void> {
        const taskRef = doc(db, TASKS, taskId);
        await updateDoc(taskRef, {
            columnId: newColumnId,
            position: newPosition,
            updatedAt: serverTimestamp()
        });
    }

    // ===============================
    // REAL-TIME SUBSCRIPTIONS
    // ===============================

    static subscribeToBoard(boardId: string, callback: (board: FirestoreBoard | null) => void): () => void {
        const boardRef = doc(db, BOARDS, boardId);
        return onSnapshot(boardRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                callback({
                    ...data,
                    id: doc.id,
                    createdAt: data.createdAt?.toDate(),
                    updatedAt: data.updatedAt?.toDate()
                } as FirestoreBoard);
            } else {
                callback(null);
            }
        });
    }

    static subscribeToBoardTasks(boardId: string, callback: (tasks: FirestoreTask[]) => void): () => void {
        const tasksRef = collection(db, TASKS);
        const q = query(
            tasksRef,
            where('boardId', '==', boardId),
            orderBy('position')
        );

        return onSnapshot(q, (querySnapshot) => {
            const tasks = querySnapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id,
                createdAt: doc.data().createdAt?.toDate(),
                updatedAt: doc.data().updatedAt?.toDate()
            })) as FirestoreTask[];

            callback(tasks);
        });
    }

    // ===============================
    // BATCH OPERATIONS
    // ===============================

    static async reorderTasks(taskUpdates: Array<{ id: string; position: number; columnId?: string }>): Promise<void> {
        const batch = writeBatch(db);

        taskUpdates.forEach(({ id, position, columnId }) => {
            const taskRef = doc(db, TASKS, id);
            const updateData: any = {
                position,
                updatedAt: serverTimestamp()
            };
            if (columnId) updateData.columnId = columnId;

            batch.update(taskRef, updateData);
        });

        await batch.commit();
    }

    // ===============================
    // TEMPLATE OPERATIONS
    // ===============================

    static async createTemplate(templateData: Omit<FirestoreTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const templateRef = await addDoc(collection(db, TEMPLATES), {
            ...templateData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return templateRef.id;
    }

    static async getTemplates(): Promise<FirestoreTemplate[]> {
        const templatesRef = collection(db, TEMPLATES);
        const q = query(templatesRef, where('isActive', '==', true), orderBy('name'));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        })) as FirestoreTemplate[];
    }

    static async getTemplate(templateId: string): Promise<FirestoreTemplate | null> {
        const templateRef = doc(db, TEMPLATES, templateId);
        const templateSnap = await getDoc(templateRef);
        if (templateSnap.exists()) {
            const data = templateSnap.data();
            return {
                ...data,
                id: templateId,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate()
            } as FirestoreTemplate;
        }
        return null;
    }

    static async createBoardFromTemplate(
        templateId: string,
        boardName: string,
        workspaceId: string,
        ownerId: string
    ): Promise<string> {
        const template = await this.getTemplate(templateId);
        if (!template) {
            throw new Error('Template not found');
        }

        // Create board with template data
        const boardData: Omit<FirestoreBoard, 'id' | 'createdAt' | 'updatedAt'> = {
            name: boardName,
            icon: template.icon,
            workspaceId,
            ownerId,
            members: [{
                userId: ownerId,
                role: 'owner'
            }],
            columns: template.columns,
            availableLabels: template.availableLabels
        };

        const boardId = await this.createBoard(boardData);

        // Create sample tasks if they exist in template
        if (template.sampleTasks && template.sampleTasks.length > 0) {
            const batch = writeBatch(db);

            template.sampleTasks.forEach(sampleTask => {
                const taskRef = doc(collection(db, TASKS));
                const taskData = {
                    ...sampleTask,
                    boardId,
                    assigneeIds: [],
                    labels: template.availableLabels.filter(label =>
                        sampleTask.labels.includes(label.id)
                    ),
                    createdBy: ownerId,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                };
                batch.set(taskRef, taskData);
            });

            await batch.commit();
        }

        return boardId;
    }

    static async updateTemplate(templateId: string, updates: Partial<FirestoreTemplate>): Promise<void> {
        const templateRef = doc(db, TEMPLATES, templateId);
        await updateDoc(templateRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
    }

    static async deactivateTemplate(templateId: string): Promise<void> {
        const templateRef = doc(db, TEMPLATES, templateId);
        await updateDoc(templateRef, {
            isActive: false,
            updatedAt: serverTimestamp()
        });
    }
}
