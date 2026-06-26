/* ================= FRIENDS CLEAN CORE v2 ================= */

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

/* ================= STATE ================= */

let appUser = null;
const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

/* ================= INIT ================= */

document.addEventListener("DOMContentLoaded", () => {
  initAuth();
});

/* ================= AUTH ================= */

function initAuth() {
  if (!isFirebase) return showAuth();

  onAuthStateChanged(auth, async (user) => {
    if (!user) return showAuth();

    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      appUser = {
        uid: user.uid,
        name: user.email,
        avatar: DEFAULT_AVATAR,
        bio: "",
        followers: [],
        following: []
      };
      await setDoc(ref, appUser);
    } else {
      appUser = snap.data();
    }

    hideAuth();
    startFeed();
  });
}

/* ================= LOGIN / REGISTER ================= */

window.handleEmailAuth = async function (e, mode) {
  e.preventDefault();

  const email = document.getElementById("login-email").value;
  const pass = document.getElementById("login-password").value;

  if (mode === "login") {
    await signInWithEmailAndPassword(auth, email, pass);
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
  }
};

/* ================= POSTS ================= */

window.publishPost = async function () {
  const text = document.getElementById("post-textarea").value.trim();
  if (!text) return;

  const post = {
    text,
    authorId: appUser.uid,
    authorName: appUser.name,
    authorAvatar: appUser.avatar,
    likesCount: 0,
    likedBy: [],
    createdAt: serverTimestamp()
  };

  await addDoc(collection(db, "posts"), post);
  document.getElementById("post-textarea").value = "";
};

/* ================= LIKE (FIXED TOGGLE) ================= */

window.likePostEngine = async function (postId) {
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

/* ================= FOLLOW SYSTEM ================= */

window.followUser = async function (targetId) {
  const userRef = doc(db, "users", appUser.uid);
  const targetRef = doc(db, "users", targetId);

  const meSnap = await getDoc(userRef);
  const me = meSnap.data();

  const isFollowing = (me.following || []).includes(targetId);

  await updateDoc(userRef, {
    following: isFollowing ? arrayRemove(targetId) : arrayUnion(targetId)
  });

  await updateDoc(targetRef, {
    followers: isFollowing ? arrayRemove(appUser.uid) : arrayUnion(appUser.uid)
  });
};

/* ================= FEED ================= */

function startFeed() {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snap) => {
    const posts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render(posts);
  });
}

function render(posts) {
  const feed = document.getElementById("app-timeline-feed");
  if (!feed) return;

  feed.innerHTML = posts.map(p => {
    const liked = (p.likedBy || []).includes(appUser.uid);

    return `
      <div class="feed-card">
        <h4>${p.authorName}</h4>
        <p>${p.text}</p>

        <button onclick="likePostEngine('${p.id}')"
          style="color:${liked ? 'red' : 'gray'}">
          ❤️ ${p.likesCount || 0}
        </button>
      </div>
    `;
  }).join("");
}

/* ================= PROFILE UPDATE ================= */

window.updateProfileCloudData = async function (name, bio) {
  appUser.name = name;
  appUser.bio = bio;

  await setDoc(doc(db, "users", appUser.uid), appUser, { merge: true });
};

/* ================= AUTH UI ================= */

function showAuth() {
  document.getElementById("auth-screen-overlay")?.style.setProperty("display", "flex");
}

function hideAuth() {
  document.getElementById("auth-screen-overlay")?.style.setProperty("display", "none");
}
