/* js/saved.js */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, collection, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyA5SS93zdj5N8oBMmjPgWvfSohdSBIRQ8c", authDomain: "friends7777.firebaseapp.com", projectId: "friends7777" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "index.html"; return; }
    listenToSavedPosts(user.uid);
});

function listenToSavedPosts(uid) {
    const container = document.getElementById("saved-items-container");
    
    onSnapshot(doc(db, "users", uid), (userSnap) => {
        if (!userSnap.exists()) return;
        const savedIds = userSnap.data().savedPosts || [];
        
        if (savedIds.length === 0) {
            container.innerHTML = `<div class="publish-content-card" style="text-align:center; color:var(--text-secondary); padding:30px; border-radius:12px; background:var(--bg-surface); border:1px solid var(--border-color);">لم تقم بحفظ أي منشورات حتى الآن. 🔖</div>`;
            return;
        }

        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        onSnapshot(q, (postsSnap) => {
            const allPosts = postsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const savedPosts = allPosts.filter(p => savedIds.includes(p.id));

            if(savedPosts.length === 0) {
                container.innerHTML = `<div class="publish-content-card" style="text-align:center; color:var(--text-secondary); padding:20px;">المنشورات التي حفظتها غير متوفرة حالياً.</div>`;
                return;
            }

            container.innerHTML = savedPosts.map(post => `
                <div class="publish-content-card" style="background:var(--bg-surface); border:1px solid var(--border-color); padding:18px; border-radius:12px; margin-bottom:12px;">
                    <div style="display:flex; gap:10px; align-items:center; margin-bottom:12px;">
                        <img src="https://www.gravatar.com/avatar/${post.authorId}?d=mp" style="width:36px; height:36px; border-radius:50%;">
                        <h4 style="margin:0; font-size:14px; font-weight:700;">${post.authorName}</h4>
                    </div>
                    <p style="font-size:14px; margin:10px 0; color:var(--text-primary); line-height:1.5; white-space:pre-wrap;">${post.text}</p>
                </div>
            `).join("");
        });
    });
}
