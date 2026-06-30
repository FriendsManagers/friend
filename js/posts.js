/* ==========================================================================
   Friends Platform - Upgraded Timeline Engine (Likes, Comments & Delete)
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA5SS93zdj5N8oBMmjPgWvfSohdSBIRQ8c",
  authDomain: "friends7777.firebaseapp.com",
  projectId: "friends7777",
  storageBucket: "friends7777.firebasestorage.app",
  messagingSenderId: "276910802465",
  appId: "1:276910802465:web:f4c3c2df36295a71960560"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserData = null;
let myUid = null;

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "index.html";
        } else {
            myUid = user.uid;
            await fetchCurrentUserInfo(myUid);
            listenToAntiFilterTimeline();
            setupPostSubmission();
        }
    });
});

async function fetchCurrentUserInfo(uid) {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            currentUserData = snap.data();
            if(document.getElementById("header-user-avatar")) document.getElementById("header-user-avatar").src = currentUserData.avatar || "https://www.gravatar.com/avatar/?d=mp";
            if(document.getElementById("publish-box-avatar")) document.getElementById("publish-box-avatar").src = currentUserData.avatar || "https://www.gravatar.com/avatar/?d=mp";
        }
    } catch (e) { console.error(e); }
}

function setupPostSubmission() {
    const btn = document.getElementById("timeline-publish-submit-btn");
    const textarea = document.getElementById("timeline-post-textarea");
    if (!btn || !textarea) return;

    btn.onclick = async () => {
        const text = textarea.value.trim();
        if (!text) return;

        try {
            await addDoc(collection(db, "posts"), {
                text: text,
                authorId: myUid,
                authorName: currentUserData ? currentUserData.name : "عضو موثق",
                isVerified: currentUserData ? currentUserData.isVerified : true,
                isProAccount: currentUserData ? (currentUserData.isProAccount || currentUserData.hasMarketplace) : false,
                likes: [],
                comments: [],
                createdAt: serverTimestamp()
            });
            textarea.value = "";
        } catch (e) { alert("حدث خطأ أثناء النشر"); }
    };
}

function listenToAntiFilterTimeline() {
    const container = document.getElementById("timeline-live-feed-wrapper");
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (posts.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:20px; color:var(--text-secondary);">التايملاين فارغ حالياً...</p>`;
            return;
        }

        container.innerHTML = posts.map((post) => {
            const likesCount = post.likes ? post.likes.length : 0;
            const hasLiked = post.likes && post.likes.includes(myUid);
            const isMyPost = post.authorId === myUid;

            // كود إظهار زر الحذف فقط لو المنشور بتاعي
            const deleteBtn = isMyPost ? `<button class="delete-post-btn" onclick="window.deletePlatformPost('${post.id}')">🗑️ حذف</button>` : "";

            // رص التعليقات الحالية
            const commentsHTML = post.comments ? post.comments.map(c => `
                <div class="single-comment-item">
                    <strong>${c.authorName}:</strong> <span>${c.text}</span>
                </div>
            `).join("") : "";

            return `
                <article class="timeline-post-card">
                    <div class="post-card-header" style="display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:12px;">
                            <img src="https://www.gravatar.com/avatar/${post.authorId}?d=mp" class="card-author-avatar">
                            <div class="card-author-meta-text">
                                <h4>${post.authorName}</h4>
                            </div>
                        </div>
                        ${deleteBtn}
                    </div>
                    <div class="post-card-body-content">
                        <p>${post.text}</p>
                    </div>
                    
                    <!-- أزرار التفاعل (لايك / تفاعل) -->
                    <div class="post-actions-bar" style="display:flex; gap:20px; margin-top:12px; border-top:1px solid var(--border-color); padding-top:8px;">
                        <button onclick="window.togglePlatformLike('${post.id}', ${hasLiked})" style="background:none; border:none; cursor:pointer; color:${hasLiked ? 'var(--accent-color)' : 'var(--text-secondary)'}; font-weight:bold;">
                            ${hasLiked ? '❤️ تم الإعجاب' : '🤍 لايك'} (${likesCount})
                        </button>
                    </div>

                    <!-- صندوق التعليقات الذكي -->
                    <div class="comments-section-wrapper" style="margin-top:10px; background:var(--bg-main); padding:10px; border-radius:var(--radius-sm);">
                        <div class="rendered-comments-list">${commentsHTML}</div>
                        <div class="comment-input-row" style="display:flex; gap:8px; margin-top:8px;">
                            <input type="text" id="input-comm-${post.id}" placeholder="اكتب تعليقاً حقيقياً..." style="flex:1; padding:6px; border:1px solid var(--border-color); background:var(--bg-surface); color:var(--text-primary); border-radius:4px;">
                            <button onclick="window.addPlatformComment('${post.id}')" style="background:var(--accent-color); color:#fff; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;">تعليق</button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    });
}

/* وظائف التفاعل العامة المربوطة بالـ Window لمنع الريفريش */
window.deletePlatformPost = async (postId) => {
    if(confirm("هل تريد حذف هذا المنشور نهائياً؟")) {
        await deleteDoc(doc(db, "posts", postId));
    }
};

window.togglePlatformLike = async (postId, hasLiked) => {
    const postRef = doc(db, "posts", postId);
    if(hasLiked) {
        await updateDoc(postRef, { likes: arrayRemove(myUid) });
    } else {
        await updateDoc(postRef, { likes: arrayUnion(myUid) });
    }
};

window.addPlatformComment = async (postId) => {
    const inp = document.getElementById(`input-comm-${postId}`);
    if(!inp || !inp.value.trim()) return;
    const postRef = doc(db, "posts", postId);
    
    await updateDoc(postRef, {
        comments: arrayUnion({
            authorId: myUid,
            authorName: currentUserData ? currentUserData.name : "عضو",
            text: inp.value.trim(),
            timestamp: Date.now()
        })
    });
    inp.value = "";
};
