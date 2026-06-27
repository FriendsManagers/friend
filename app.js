/* ==========================================================================
   Friends Ultra-Clean Core UI & Engine - 2026 Integrated Edition (Fixed Demo)
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

// فحص ذكي: لو الرموز وهمية يتم تشغيل أزرار الواجهة كـ Demo دون قفل الصفحة
if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" && !firebaseConfig.apiKey.includes("YOUR")) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebase = true;
    console.log("🔥 Firebase connected successfully!");
  } catch (e) {
    console.log("⚠️ Firebase initialization failed, running in Demo Mode.");
  }
} else {
  console.log("ℹ️ Running in Demo Mode (No real Firebase keys provided). Navigation is active!");
}

/* ================= STATE & CONSTANTS ================= */
let appUser = null;
let activePostIdForComments = null;
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

/* ================= INIT ON LOAD ================= */
document.addEventListener("DOMContentLoaded", () => {
  initAuth();
  initUIComponents(); // تشغيل عناصر الواجهة الفخمة
  initNavigationBypass(); // تشغيل أزرار التنقل السفلية والعلوية
});

/* ================= UI INTERACTIONS (LIGHTBOX, SHEET, TOAST) ================= */
function initUIComponents() {
  const backdrop = document.getElementById("comments-backdrop");
  const sheet = document.getElementById("comments-sheet");
  const closeComments = document.getElementById("close-comments-btn");

  const closeSheetFunc = () => {
    if (backdrop) backdrop.classList.remove("open");
    if (sheet) sheet.classList.remove("open");
    document.body.style.overflow = "";
    activePostIdForComments = null;
  };

  if (closeComments) closeComments.addEventListener("click", closeSheetFunc);
  if (backdrop) backdrop.addEventListener("click", closeSheetFunc);

  const lightbox = document.getElementById("global-lightbox");
  const closeLightbox = document.getElementById("close-lightbox-btn");
  if (closeLightbox) {
    closeLightbox.addEventListener("click", () => {
      lightbox.style.display = "none";
      document.body.style.overflow = "";
    });
  }

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

/* ================= NAVIGATION BYPASS (NEW) ================= */
function initNavigationBypass() {
  // تشغيل زراير التنقل السفلية لايف بين الصفحات المرفوعة
  document.querySelectorAll(".bottom-nav .nav-item, .main-header .circle-btn").forEach(item => {
    item.addEventListener("click", (e) => {
      const href = item.getAttribute("href") || item.getAttribute("onclick")?.match(/'([^']+)'/)?.[1];
      if (href && href !== "#" && !href.startsWith("location")) {
        e.preventDefault();
        window.location.href = href;
      }
    });
  });

  // تشغيل جرس الإشعارات اللطيف علوياً
  document.getElementById("noti-btn")?.addEventListener("click", () => {
    window.showToast("No new notifications", "🔔");
  });
}

/* ================= AUTH LOGIC ================= */
function initAuth() {
  if (!isFirebase) {
    // محاكاة مستخدم وهمي في نمط الديمو لتشغيل الواجهة والبروفايل فوراً
    appUser = {
      uid: "demo_user",
      name: "Demo Manager",
      avatar: DEFAULT_AVATAR,
      bio: "Managing the awesome Friends App!",
      followers: [1, 2, 3],
      following: [1, 2]
    };
    setupUIForUser();
    // إذا كنا في صفحة البروفايل، نقوم بملء البيانات تلقائياً
    fillProfilePageData();
    return;
  }

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

    setupUIForUser();
    fillProfilePageData();
    hideAuth();
    startFeed();
  });
}

function setupUIForUser() {
  document.querySelectorAll("#nav-profile-img, .user-avatar").forEach(img => {
    img.src = appUser.avatar || DEFAULT_AVATAR;
  });
}

function fillProfilePageData() {
  const pName = document.getElementById("profile-page-name");
  const pBio = document.getElementById("profile-page-bio");
  const pAvatar = document.getElementById("profile-page-avatar");
  
  if (pName) pName.innerText = appUser.name;
  if (pBio) pBio.innerText = appUser.bio || "No bio available yet.";
  if (pAvatar) pAvatar.src = appUser.avatar || DEFAULT_AVATAR;

  // وضع أرقام تجريبية في نمط الديمو لعدادات المتابعين
  if (document.getElementById("followers-count")) {
    document.getElementById("followers-count").innerText = appUser.followers.length;
    document.getElementById("following-count").innerText = appUser.following.length;
    document.getElementById("posts-count").innerText = "0";
  }
}

window.handleEmailAuth = async function (e, mode) {
  e.preventDefault();
  if (!isFirebase) return window.showToast("Firebase is in Demo Mode", "ℹ️");

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

  if (!isFirebase) {
    textarea.value = "";
    window.showToast("Published on Demo Mode!", "🚀");
    return;
  }

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
  
  const btn = document.querySelector(`[data-like-id="${postId}"]`);
  if (btn) {
    btn.classList.toggle("liked");
    btn.style.transform = "scale(1.2)";
    setTimeout(() => btn.style.transform = "", 150);
  }

  if (!isFirebase) return;

  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;

  const data = snap.data();
  const liked = (data.likedBy || []).includes(appUser.uid);

  await updateDoc(ref, {
    likedBy: liked ? arrayRemove(appUser.uid) : arrayUnion(appUser.uid),
    likesCount: increment(liked ? -1 : 1)
  });
};

/* ================= COMMENTS INLINE ENGINE ================= */
window.openCommentsSheet = function(postId) {
    activePostIdForComments = postId;
    const backdrop = document.getElementById("comments-backdrop");
    const sheet = document.getElementById("comments-sheet");
    
    if (backdrop) backdrop.classList.add("open");
    if (sheet) sheet.classList.add("open");
    document.body.style.overflow = "hidden";
    
    if (isFirebase) {
        startCommentsListener(postId);
    } else {
        const container = document.getElementById("comments-list-body");
        if (container) container.innerHTML = `<p style="text-align:center; color:var(--text-secondary); padding:20px;">Demo comments active. Add a comment!</p>`;
    }
};

function startCommentsListener(postId) {
    const q = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
    onSnapshot(q, (snap) => {
        if (activePostIdForComments !== postId) return;
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

const sendCommentBtn = document.getElementById("send-comment-btn");
if (sendCommentBtn) {
    sendCommentBtn.addEventListener("click", async () => {
        const input = document.getElementById("new-comment-input");
        const text = input.value.trim();
        if (!text || !activePostIdForComments) return;

        if (!isFirebase) {
            input.value = "";
            window.showToast("Comment added (Demo)!", "💬");
            return;
        }

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

/* ================= TIMELINE REALTIME FEED ================= */
function startFeed() {
  if (!isFirebase) return;
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
  if (isFirebase) {
    await setDoc(doc(db, "users", appUser.uid), appUser, { merge: true });
  }
  fillProfilePageData();
  window.showToast("Profile updated successfully!");
};

function showAuth() {
  document.getElementById("auth-screen-overlay")?.style.setProperty("display", "flex");
}

function hideAuth() {
  document.getElementById("auth-screen-overlay")?.style.setProperty("display", "none");
}
