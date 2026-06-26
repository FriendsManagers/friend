/* ================= FRIENDS SOCIAL LAYER ================= */

import {
doc,
getDoc,
setDoc,
updateDoc,
arrayUnion,
arrayRemove,
collection,
addDoc,
query,
orderBy,
onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

import { db } from "./firebase.js"; 
// لو انت مش عامل firebase.js تجاهل السطر ده وخلي db global

let appUser = null;

/* ================= INIT USER ================= */

export function setCurrentUser(user) {
appUser = user;
}

/* ================= FOLLOW SYSTEM ================= */

window.followUser = async function (targetId) {
if (!appUser || targetId === appUser.uid) return;

const meRef = doc(db, "users", appUser.uid);
const targetRef = doc(db, "users", targetId);

const meSnap = await getDoc(meRef);
const meData = meSnap.data();

const isFollowing = (meData.following || []).includes(targetId);

// toggle follow
await updateDoc(meRef, {
following: isFollowing ? arrayRemove(targetId) : arrayUnion(targetId)
});

await updateDoc(targetRef, {
followers: isFollowing ? arrayRemove(appUser.uid) : arrayUnion(appUser.uid)
});

createNotification(targetId, "follow");
};

/* ================= NOTIFICATIONS ================= */

export async function createNotification(to, type) {
const ref = collection(db, "notifications");

await addDoc(ref, {
to,
from: appUser.uid,
fromName: appUser.name,
type,
read: false,
createdAt: Date.now()
});
}

/* ================= NOTIFICATIONS LISTENER ================= */

export function listenNotifications(callback) {
const q = query(
collection(db, "notifications"),
orderBy("createdAt", "desc")
);

return onSnapshot(q, (snap) => {
const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
callback(data.filter(n => n.to === appUser.uid));
});
}
