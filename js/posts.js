/* js/posts.js */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, deleteDoc, updateDoc, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyA5SS93zdj5N8oBMmjPgWvfSohdSBIRQ8c", authDomain: "friends7777.firebaseapp.com", projectId: "friends7777" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let myUid = null;
let currentUserData = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "index.html"; return; }
    myUid = user.uid;
    const userDoc = await getDoc(doc(db, "users", myUid));
    if (userDoc.exists()) {
        currentUserData = userDoc.data();
        if(document.getElementById("header-user-avatar")) document.getElementById("header-user-avatar").src = currentUserData.avatar || "https://www.gravatar.com/avatar/?d=mp";
        if(document.getElementById("publish-box-avatar")) document.getElementById("publish-box-avatar").src = currentUserData.avatar || "https://www.gravatar.com/avatar/?d=mp";
    }
    listenToTimeline();
    setupPublishing();
});

function listenToTimeline() {
    const wrapper = document.getElementById("timeline-live-feed-wrapper");
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (posts.length === 0) {
            wrapper.innerHTML = `<p style="text-align:center; color:var(--text-secondary); padding:20px;">لا توجد منشورات حالياً.</p>`;
            return;
        }

        wrapper.innerHTML = posts.map(post => {
            const isOwner = post.authorId === myUid;
            const comments = post.comments || [];
            
            return `
                <div class="publish-content-card animate-fade-in-up" style="position:relative; background: var(--bg-surface); border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; margin-bottom: 16px;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; gap:10px; align-items:center;">
                            <img src="https://www.gravatar.com/avatar/${post.authorId}?d=mp" style="width:40px; height:40px; border-radius:50%;">
                            <div>
                                <h4 style="margin:0; font-size:14px; font-weight:700;">${post.authorName}</h4>
                            </div>
                        </div>
                        <div style="display:flex; gap:8px;">
                            <button onclick="savePost('${post.id}')" style="background:none; border:none; cursor:pointer; font-size:16px;" title="حفظ المنشور">🔖</button>
                            ${isOwner ? `<button onclick="deletePost('${post.id}')" style="background:rgba(239,68,68,0.08); border:none; color:#ef4444; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; display:flex; align-items:center; gap:4px;" title="حذف المنشور">🗑️ حذف</button>` : ''}
                        </div>
                    </div>
                    <p style="margin:15px 0; font-size:15px; color:var(--text-primary); line-height:1.6; white-space:pre-wrap;">${post.text}</p>
                    
                    <!-- نظام التعليقات المطور بحذف فردي للتعليق -->
                    <div style="border-top:1px solid var(--border-color); padding-top:12px; margin-top:12px;">
                        <div id="comments-box-${post.id}" style="display:flex; flex-direction:column; gap:6px; margin-bottom:10px;">
                            ${comments.map((c, idx) => `
                                <div style="background:var(--bg-main); padding:8px 12px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                                    <p style="margin:0; font-size:13px; color:var(--text-primary);"><strong>${c.authorName}:</strong> ${c.text}</p>
                                    ${c.authorId === myUid ? `<button onclick="deleteComment('${post.id}', ${idx})" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:12px; padding:0 4px;">🗑️</button>` : ''}
                                </div>
                            `).join("")}
                        </div>
                        <div style="display:flex; gap:8px;">
                            <input type="text" id="comment-input-${post.id}" class="base-input" placeholder="اكتب تعليقاً..." style="flex:1; height:34px; font-size:13px; background:var(--bg-main); border:1px solid var(--border-color); border-radius:6px; padding:0 10px; color:var(--text-primary); outline:none;">
                            <button onclick="addComment('${post.id}')" class="base-btn btn-accent" style="height:34px; padding:0 14px; font-size:12px;">تعليق</button>
                        </div>
                    </div>
                </div>
            `;
        }).join("");
    });
}

function setupPublishing() {
    const btn = document.getElementById("timeline-publish-submit-btn");
    const txt = document.getElementById("timeline-post-textarea");
    if(!btn || !txt) return;

    btn.onclick = async () => {
        const val = txt.value.trim();
        if(!val) return;
        btn.disabled = true;
        await addDoc(collection(db, "posts"), {
            text: val,
            authorId: myUid,
            authorName: currentUserData ? currentUserData.name : "عضو موثق",
            comments: [],
            createdAt: serverTimestamp()
        });
        txt.value = "";
        btn.disabled = false;
    };
}

window.deletePost = async (id) => {
    if(confirm("هل أنت متأكد من حذف المنشور؟")) {
        await deleteDoc(doc(db, "posts", id));
    }
};

window.savePost = async (id) => {
    await updateDoc(doc(db, "users", myUid), {
        savedPosts: arrayUnion(id)
    });
    alert("تم حفظ المنشور في العناصر المحفوظة! 🔖");
};

window.addComment = async (postId) => {
    const inp = document.getElementById(`comment-input-${postId}`);
    if(!inp || !inp.value.trim()) return;
    const commentData = {
        authorId: myUid,
        authorName: currentUserData ? currentUserData.name : "عضو",
        text: inp.value.trim()
    };
    await updateDoc(doc(db, "posts", postId), {
        comments: arrayUnion(commentData)
    });
    inp.value = "";
};

window.deleteComment = async (postId, index) => {
    const postSnap = await getDoc(doc(db, "posts", postId));
    if(postSnap.exists()) {
        const comments = postSnap.data().comments || [];
        comments.splice(index, 1);
        await updateDoc(doc(db, "posts", postId), { comments: comments });
    }
};
