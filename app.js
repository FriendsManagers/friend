/* ==========================================================================
   Friends Debug & Live Engine - 2026 Production Edition
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
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
  apiKey: "AIzaSyDEU_O_S-v8mE-2OaN6fUX_x0C2fU2g3E",
  authDomain: "friend-70df5.firebaseapp.com",
  projectId: "friend-70df5",
  storageBucket: "friend-70df5.appspot.com",
  messagingSenderId: "1032587841120",
  appId: "1:1032587841120:web:86e927f91ef38bb7894a82"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUserData = null;
let activePostIdForComments = null;
let isSignUpMode = false;
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

document.addEventListener("DOMContentLoaded", () => {
  initAuthSystem();
  initStaticUIHandlers();
});

function showToast(message, icon = "✨") {
  const toast = document.getElementById("app-toast");
  if (!toast) return;
  toast.querySelector(".toast-text-message").innerText = message;
  toast.querySelector(".toast-icon").innerText = icon;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 5000); // زيادة الوقت لقراءة الخطأ
}

function initStaticUIHandlers() {
  const backdrop = document.getElementById("comments-backdrop");
  const sheet = document.getElementById("comments-sheet");
  const closeComments = document.getElementById("close-comments-btn");

  const closeSheetFunc = () => {
    if (backdrop) backdrop.classList.remove("open");
    if (sheet) sheet.classList.remove("open");
    activePostIdForComments = null;
  };

  if (closeComments) closeComments.addEventListener("click", closeSheetFunc);
  if (backdrop) backdrop.addEventListener("click", closeSheetFunc);

  const publishBtn = document.getElementById("publish-post-btn");
  if (publishBtn) {
    publishBtn.addEventListener("click", async () => {
      const textarea = document.getElementById("post-textarea");
      const text = textarea.value.trim();
      if (!text) return;

      publishBtn.disabled = true;
      try {
        await addDoc(collection(db, "posts"), {
          text,
          authorId: auth.currentUser.uid,
          authorName: currentUserData.name || "مستخدم في Friends",
          authorAvatar: currentUserData.avatar || DEFAULT_AVATAR,
          likesCount: 0,
          likedBy: [],
          createdAt: serverTimestamp()
        });
        textarea.value = "";
        showToast("تم نشر منشورك الحقيقي لايف! 🚀", "✅");
      } catch (err) {
        showToast("فشل النشر: " + err.message, "❌");
      }
      publishBtn.disabled = false;
    });
  }

  const submitCommentBtn = document.getElementById("submit-comment-btn");
  if (submitCommentBtn) {
    submitCommentBtn.addEventListener("click", async () => {
      const input = document.getElementById("comment-input");
      const text = input.value.trim();
      if (!text || !activePostIdForComments) return;

      submitCommentBtn.disabled = true;
      try {
        const commentCollection = collection(db, "posts", activePostIdForComments, "comments");
        await addDoc(commentCollection, {
          text,
          authorName: currentUserData.name || "مستخدم في Friends",
          authorAvatar: currentUserData.avatar || DEFAULT_AVATAR,
          createdAt: serverTimestamp()
        });
        input.value = "";
        showToast("تم إضافة تعليقك بالثانية لايف!", "💬");
      } catch (err) {
        showToast("خطأ بالتعليق: " + err.message, "❌");
      }
      submitCommentBtn.disabled = false;
    });
  }
}

function initAuthSystem() {
  const overlay = document.getElementById("auth-overlay");
  const switchBtn = document.getElementById("auth-switch-btn");
  const submitBtn = document.getElementById("auth-submit-btn");

  if (switchBtn) {
    switchBtn.addEventListener("click", () => {
      isSignUpMode = !isSignUpMode;
      document.getElementById("auth-title").innerText = isSignUpMode ? "إنشاء حساب جديد" : "تسجيل الدخول";
      document.getElementById("name-group").style.display = isSignUpMode ? "block" : "none";
      submitBtn.innerText = isSignUpMode ? "تسجيل الحساب" : "دخول";
      document.getElementById("auth-switch").innerHTML = isSignUpMode 
        ? 'لديك حساب بالفعل؟ <span id="auth-switch-btn" style="color:var(--accent-color);font-weight:700;cursor:pointer;">سجل دخولك</span>' 
        : 'ليس لديك حساب؟ <span id="auth-switch-btn" style="color:var(--accent-color);font-weight:700;cursor:pointer;">إنشاء حساب جديد</span>';
      initAuthSystem();
    });
  }

  if (submitBtn) {
    submitBtn.onclick = async () => {
      const email = document.getElementById("auth-email").value.trim();
      const password = document.getElementById("auth-password").value.trim();
      const name = document.getElementById("auth-name").value.trim();

      if (!email || !password || (isSignUpMode && !name)) {
        showToast("يرجى تعبئة كافة البيانات الحقيقية.", "⚠️");
        return;
      }

      submitBtn.disabled = true;
      try {
        if (isSignUpMode) {
          console.log("جاري محاولة إنشاء الحساب لـ:", email);
          const credential = await createUserWithEmailAndPassword(auth, email, password);
          const profile = {
            uid: credential.user.uid,
            name: name,
            avatar: DEFAULT_AVATAR,
            bio: "عضو جديد في منصة Friends الرسمية لايف!",
            followers: [],
            following: []
          };
          await setDoc(doc(db, "users", credential.user.uid), profile);
          currentUserData = profile;
          showToast("تم تسجيل حسابك الحقيقي بنجاح! 🎉", "✅");
        } else {
          console.log("جاري محاولة تسجيل الدخول لـ:", email);
          await signInWithEmailAndPassword(auth, email, password);
          showToast("مرحباً بك مجدداً في تايملاين Friends لايف! 🔥", "👋");
        }
      } catch (err) {
        console.error("خطأ الفايربيز التفصيلي:", err);
        // هنا هيطبعلك النص الصريح للخطأ عشان نعرف المشكلة فين بالظبط
        showToast("السبب: " + err.message, "❌");
      }
      submitBtn.disabled = false;
    };
  }

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      if (snapshot.exists()) {
        currentUserData = snapshot.data();
      } else {
        currentUserData = { uid: user.uid, name: user.email.split('@')[0], avatar: DEFAULT_AVATAR, bio: "" };
      }
      if (overlay) overlay.style.display = "none";
      syncCoreUserInterface();
      listenToIncomingPosts();
    } else {
      if (overlay) overlay.style.display = "flex";
    }
  });
}

function syncCoreUserInterface() {
  document.querySelectorAll("#nav-profile-img, #publisher-avatar, .user-avatar").forEach(img => {
    img.src = currentUserData.avatar || DEFAULT_AVATAR;
  });
  const textInput = document.getElementById("post-textarea");
  if (textInput) textInput.placeholder = `ماذا يدور في ذهنك اليوم يا ${currentUserData.name}؟`;
}

function listenToIncomingPosts() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    renderLiveTimeline(list);
  }, (err) => {
    showToast("خطأ في جلب البيانات: " + err.message, "❌");
  });
}

function renderLiveTimeline(posts) {
  const container = document.getElementById("feed-timeline-container");
  if (!container) return;

  if (posts.length === 0) {
    container.innerHTML = `<div style="text-align:center;color:var(--text-secondary);padding:50px 20px;font-size:14px;">لا يوجد أي منشورات عامة بعد الحين، كن أول من ينشر فكرته لايف! 🚀</div>`;
    return;
  }

  container.innerHTML = posts.map(p => {
    const hasLiked = (p.likedBy || []).includes(auth.currentUser.uid);
    const timeFormatted = p.createdAt ? new Date(p.createdAt.seconds * 1000).toLocaleDateString('ar-EG') : "الآن";

    return `
      <article class="feed-card">
          <div class="card-header">
              <div class="card-user-info">
                  <img src="${p.authorAvatar || DEFAULT_AVATAR}" class="user-avatar">
                  <div class="post-meta">
                      <h4>${p.authorName}</h4>
                      <span>${timeFormatted}</span>
                  </div>
              </div>
          </div>
          <div class="post-body-text">${p.text}</div>
          <div class="card-actions-bar">
              <button onclick="window.executePostLike('${p.id}')" class="action-btn ${hasLiked ? 'liked' : ''}">
                  ❤️ <span class="count">${p.likesCount || 0}</span>
              </button>
              <button onclick="window.openCommentsSheet('${p.id}')" class="action-btn">
                  💬 <span>التعليقات</span>
              </button>
          </div>
      </article>
    `;
  }).join("");
}

window.executePostLike = async function (postId) {
  try {
    const ref = doc(db, "posts", postId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return;

    const data = snap.data();
    const liked = (data.likedBy || []).includes(auth.currentUser.uid);

    await updateDoc(ref, {
      likedBy: liked ? arrayRemove(auth.currentUser.uid) : arrayUnion(auth.currentUser.uid),
      likesCount: increment(liked ? -1 : 1)
    });
  } catch (err) {}
};

window.openCommentsSheet = function (postId) {
  activePostIdForComments = postId;
  
  document.getElementById("comments-backdrop").classList.add("open");
  document.getElementById("comments-sheet").classList.add("open");

  const body = document.getElementById("sheet-comments-body");
  if (body) body.innerHTML = `<div style="text-align:center;padding:20px;color:var(--text-secondary);">جاري تحميل التعليقات لايف...</div>`;

  const commentQuery = query(collection(db, "posts", postId, "comments"), orderBy("createdAt", "asc"));
  onSnapshot(commentQuery, (snap) => {
    if (activePostIdForComments !== postId || !body) return;

    const comments = snap.docs.map(d => d.data());
    if (comments.length === 0) {
      body.innerHTML = `<p style="text-align:center;color:var(--text-secondary);padding:30px;font-size:13.5px;">لا توجد أي تعليقات حقيقية هنا بعد. اكتب تعليقاً بالأسفل!</p>`;
      return;
    }

    body.innerHTML = comments.map(c => `
      <div class="comment-item">
          <img src="${c.authorAvatar || DEFAULT_AVATAR}" class="user-avatar" style="width:34px;height:34px;">
          <div class="comment-bubble">
              <h5 style="font-size:12.5px;font-weight:700;margin-bottom:3px;color:var(--accent-color);">${c.authorName}</h5>
              <p style="font-size:13.5px;color:var(--text-primary);">${c.text}</p>
          </div>
      </div>
    `).join("");
  });
};
