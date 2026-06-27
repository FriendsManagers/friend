/* ==========================================================================
   Friends Ultra-Clean Core UI & Engine - 2026 Integrated Edition
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ================= FIREBASE CONFIG ================= */
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let auth, db, isFirebase = false;

try {
  if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebase = true;
  }
} catch (e) {
  console.log("Firebase disabled");
}

/* ================= STATE & CONSTANTS ================= */
let appUser = null;
let activePostIdForComments = null; // لحفظ الأيدي الخاص بالبوست المفتوح تعليقاته حالياً
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

/* ================= INIT ON LOAD ================= */
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initUIComponents(); // تشغيل عناصر الواجهة الفخمة
});

/* ================= UI INTERACTIONS (LIGHTBOX, SHEET, TOAST) ================= */
function initUIComponents() {
  // إغلاق الـ Bottom Sheet للتعليقات
  const backdrop = document.getElementById("comments-backdrop");
  const sheet = document.getElementById("comments-sheet");
  const closeComments = document.getElementById("close-comments-btn");

  const closeSheetFunc = () => {
    backdrop.classList.remove("open");
    sheet.classList.remove("open");
    document.body.style.overflow = "";
    activePostIdForComments = null;
  };

  if (closeComments) closeComments.addEventListener("click", closeSheetFunc);
  if (backdrop) backdrop.addEventListener("click", closeSheetFunc);

  // إغلاق الـ Lightbox لعرض الصور
  const lightbox = document.getElementById("global-lightbox");
  const closeLightbox = document.getElementById("close-lightbox-btn");
  if (closeLightbox) {
    closeLightbox.addEventListener("click", () => {
      lightbox.style.display = "none";
      document.body.style.overflow = "";
    });
  }

  // ربط زر النشر الفخم الموجود في الـ HTML بكود الفايربيز الأساسي الخاص بك
  const publishBtn = document.getElementById("publish-post-btn");
  if (publishBtn) {
    publishBtn.addEventListener("click", async () => {
      publishBtn.disabled = true;
      await window.publishPost();
      publishBtn.disabled = false;
    });
  }
}

// دالة التوست الإشعاري الفخم
window.showToast = function (message, icon = "✨") {
  const toast = document.getElementById("app-toast");
  if (!toast) return;
  toast.querySelector(".toast-text-message").innerText = message;
  toast.querySelector(".toast-icon").innerText = icon;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
};

/* ================= AUTH LOGIC ================= */
function initAuth() {
  if (!isFirebase) return showAuth();

  onAuthStateChanged(auth, async (user) => {
    if (!user) return showAuth();

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      appUser = {
        uid: user.uid,
        name: user.email.split('@')[0],
        avatar: DEFAULT_AVATAR,
        bio: "",
        followers: [],
        following: []
      };
      await setDoc(ref, appUser);
    } else {
      appUser = snap.data();
    }

    // تحديث الصور الشخصية في الهيدر وصندوق النشر فوراً بعد تسجيل الدخول
    document.querySelectorAll("#nav-profile-img, .user-avatar").forEach(img => {
        img.src = appUser.avatar || DEFAULT_AVATAR;
    });

    hideAuth();
    startFeed();
  });
}

window.handleEmailAuth = async function (e, mode) {
  e.preventDefault();
  try {
    const email = document.getElementById("login-email").value;
    const pass = document.getElementById("login-password").value;

    if (mode === "login") {
      await signInWithEmailAndPassword(auth, email, pass);
      window.showToast("Welcome back!", "👋");
    }

    if (mode === "register") {
      const name = document.getElementById("reg-name").value;
      const cred = await createUserWithEmailAndPassword(auth, email, pass);

      appUser = {
        uid: cred.user.uid,
        name,
        email,
        avatar: DEFAULT_AVATAR,
        bio: "",
        followers: [],
        following: []
      };
      await setDoc(doc(db, "users", cred.user.uid), appUser);
      window.showToast("Account created!", "🎉");
    }
  } catch (error) {
    window.showToast(error.message, "❌");
  }
};

/* ================= POSTS LOGIC ================= */
window.publishPost = async function () {
  const textarea = document.getElementById("post-textarea");
  const text = textarea.value.trim();
  if (!text) return;

  try {
    const post = {
      text,
      authorId: appUser.uid,
      authorName: appUser.name,
      authorAvatar: appUser.avatar || DEFAULT_AVATAR,
      likesCount: 0,
      likedBy: [],
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "posts"), post);
    textarea.value = "";
    window.showToast("Post published!", "🚀");
  } catch (e) {
    window.showToast("Error publishing", "❌");
  }
};

/* ================= LIKE SYSTEM ================= */
window.likePostEngine = async function (postId) {
  if (!appUser) return;
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const data = snap.data();
  const liked = (data.likedBy || []).includes(appUser.uid);

  // أنميشن بوب آب خفيف وتغيير فوري للون قبل إرسال الطلب للسيرفر لسرعة الاستجابة (UX)
  const btn = document.querySelector(`[data-like-id="${postId}"]`);
  if (btn) {
      btn.classList.toggle("liked");
      btn.style.transform = "scale(1.2)";
      setTimeout(() => btn.style.transform = "", 150);
  }

  await updateDoc(ref, {
    likedBy: liked ? arrayRemove(appUser.uid) : arrayUnion(appUser.uid),
    likesCount: increment(liked ? -1 : 1)
  });
};

/* ================= COMMENTS INLINE ENGINE (NEW) ================= */
window.openCommentsSheet = function(postId) {
    activePostIdForComments = postId;
    const backdrop = document.getElementById("comments-backdrop");
    const sheet = document.getElementById("comments-sheet");
    
    backdrop.classList.add("open");
    sheet.classList.add("open");
    document.body.style.overflow = "hidden";
    
    // استدعاء جلب التعليقات الخاصة بهذا البوست من الفايربيز
    startCommentsListener(postId);
};

function startCommentsListener(postId) {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    onSnapshot(q, (snap) => {
        if (activePostIdForComments !== postId) return; // حماية لعدم تداخل الغرف
        const container = document.getElementById("comments-list-body");
        if (!container) return;

        if (snap.empty) {
            container.innerHTML = `<p style="text-align:center; color:var(--text-secondary); padding:20px;">No comments yet. Be the first!</p>`;
            return;
        }

        container.innerHTML = snap.docs.map(d => {
            const c = d.data();
            return `
                <div class="comment-item">
                    <img src="${c.userAvatar || DEFAULT_AVATAR}" alt="User" class="user-avatar" style="width:32px; height:32px;">
                    <div class="comment-bubble">
                        <strong>${c.userName}:</strong>
                        <p style="margin-top:2px; font-size:13px;">${c.text}</p>
                    </div>
                </div>
            `;
        }).join("");
    });
}

// تنفيذ إرسال تعليق جديد
const sendCommentBtn = document.getElementById("send-comment-btn");
if (sendCommentBtn) {
    sendCommentBtn.addEventListener("click", async () => {
        const input = document.getElementById("new-comment-input");
        const text = input.value.trim();
        if (!text || !activePostIdForComments) return;

        const commentData = {
            text,
            userId: appUser.uid,
            userName: appUser.name,
            userAvatar: appUser.avatar || DEFAULT_AVATAR,
            createdAt: serverTimestamp()
        };

        input.value = "";
        await addDoc(collection(db, "posts", activePostIdForComments, "comments"), commentData);
    });
}

/* ================= LIGHTBOX TRIGGER ================= */
window.openGlobalLightbox = function(imgSrc) {
    const lightbox = document.getElementById("global-lightbox");
    const lightboxImg = document.getElementById("lightbox-img");
    lightboxImg.src = imgSrc;
    lightbox.style.display = "flex";
    document.body.style.overflow = "hidden";
};

/* ================= TIMELINE REALTIME FEED ================= */
function startFeed() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTimeline(posts);
  });
}

function renderTimeline(posts) {
  const feed = document.getElementById("feed-timeline-container");
  if (!feed) return;

  if (posts.length === 0) {
      feed.innerHTML = `<p style="text-align:center; padding:40px; color:var(--text-secondary);">No posts yet. Start sharing your moments!</p>`;
      return;
  }

  feed.innerHTML = posts.map(p => {
    const liked = (p.likedBy || []).includes(appUser.uid);
    // معالجة الوقت بشكل مبسط في حال لم يأتي السيرفر بالتايم ستامب فوراً
    const timeString = p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : "Just now";

    return `
      <article class="feed-card">
          <div class="card-header">
              <div class="card-user-info">
                  <img src="${p.authorAvatar || DEFAULT_AVATAR}" alt="Author" class="user-avatar">
                  <div class="post-meta">
                      <h4>${p.authorName}</h4>
                      <span>${timeString}</span>
                  </div>
              </div>
          </div>
          
          <div class="post-body-text">${p.text}</div>
          
          <div class="card-actions-bar">
              <button onclick="likePostEngine('${p.id}')" data-like-id="${p.id}" class="action-btn ${liked ? 'liked' : ''}">
                  ❤️ <span class="count">${p.likesCount || 0}</span>
              </button>
              <button onclick="openCommentsSheet('${p.id}')" class="action-btn">
                  💬 <span>Comment</span>
              </button>
              <button class="action-btn">
                  🔖 <span>Save</span>
              </button>
          </div>
      </article>
    `;
  }).join("");
}

/* ================= PROFILE & UTILS ================= */
window.updateProfileCloudData = async function (name, bio) {
  appUser.name = name;
  appUser.bio = bio;
  await setDoc(doc(db, "users", appUser.uid), appUser, { merge: true });
  window.showToast("Profile updated successfully!");
};

function showAuth() {
  document.getElementById("auth-screen-overlay")?.style.setProperty("display", "flex");
}

function hideAuth() {
  document.getElementById("auth-screen-overlay")?.style.setProperty("display", "none");
}
