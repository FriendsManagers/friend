/* js/videos.js */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyA5SS93zdj5N8oBMmjPgWvfSohdSBIRQ8c", authDomain: "friends7777.firebaseapp.com", projectId: "friends7777" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
let myUid = null;

onAuthStateChanged(auth, (user) => {
    if(!user) return; myUid = user.uid;
    listenToVideos();
    setupVideoPublish();
});

function setupVideoPublish() {
    const btn = document.getElementById("btn-publish-video");
    if(!btn) return;
    btn.onclick = async () => {
        const title = document.getElementById("video-title-input").value.trim();
        const url = document.getElementById("video-url-input").value.trim();
        if(!title || !url) return;
        btn.innerText = "جاري النشر...";
        await addDoc(collection(db, "videos"), { title, url, authorId: myUid, createdAt: serverTimestamp() });
        document.getElementById("video-title-input").value = "";
        document.getElementById("video-url-input").value = "";
        btn.innerText = "نشر الفيديو";
    };
}

function listenToVideos() {
    const container = document.getElementById("videos-stream-container");
    const q = query(collection(db, "videos"), orderBy("createdAt", "desc"));
    onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if(items.length === 0) { container.innerHTML = `<p style="text-align:center; color:var(--text-secondary);">لا توجد فيديوهات منشورة حالياً.</p>`; return; }
        container.innerHTML = items.map(v => `
            <div style="background:var(--bg-main); border:1px solid var(--border-color); padding:12px; border-radius:var(--radius-md);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <h4 style="margin:0;">${v.title}</h4>
                    ${v.authorId === myUid ? `<button onclick="deleteVid('${v.id}')" style="background:none; border:none; color:#ff4d4d; cursor:pointer;">🗑️ حذف</button>` : ''}
                </div>
                <video src="${v.url}" controls style="width:100%; border-radius:var(--radius-sm); max-height:360px; background:#000;"></video>
            </div>
        `).join("");
    });
}
window.deleteVid = async (id) => { if(confirm("حذف الفيديو؟")) await deleteDoc(doc(db, "videos", id)); };
