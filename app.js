/* ==========================================================================
   Friends Core Production Engine - 2026 Edition (Full Stack Hybrid)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, onSnapshot, updateDoc, arrayUnion, arrayRemove, increment, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. إعدادات الفايربيز (ضع مفاتيحك هنا لتشغيل السحابة العالمية)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 2. تهيئة وتأمين النظام ضد الانهيار
let auth = null, db = null, isFirebaseReady = false;
try {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY") {
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        isFirebaseReady = true;
    }
} catch (error) {
    console.warn("Firebase config missing. Running on Hybrid LocalEngine mode.");
}

// 3. إدارة الحالة العامة للمنصة (State Management)
let appUser = null;
const DEFAULT_AVATAR = "https://www.instagram.com/static/images/anonymousUser.jpg/73e970b629f6.jpg";

// محاكاة قاعدة البيانات المحلية النظيفة (حتى لا تنهار المنصة في غياب السحابة)
if (!localStorage.getItem("local_posts")) localStorage.setItem("local_posts", JSON.stringify([]));
if (!localStorage.getItem("local_users")) localStorage.setItem("local_users", JSON.stringify([]));

// 4. فحص حالة الولوج المركزية عند إقلاع التطبيق
document.addEventListener("DOMContentLoaded", () => {
    initAppEngine();
});

function initAppEngine() {
    if (isFirebaseReady) {
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, "users", user.uid));
                if (userDoc.exists()) {
                    appUser = userDoc.data();
                } else {
                    appUser = { uid: user.uid, name: user.displayName || "مطور جديد", email: user.email, avatar: user.photoURL || DEFAULT_AVATAR, bio: "مرحباً بك في عالمي!", savedPosts: [] };
                    await setDoc(doc(db, "users", user.uid), appUser);
                }
                hideAuthOverlay();
                startLiveFeed();
            } else {
                showAuthOverlay();
            }
        });
    } else {
        // إدارة الجلسة المحلية الفورية (الوضع التجريبي الذكي المتكامل)
        const session = sessionStorage.getItem("local_session");
        if (session) {
            appUser = JSON.stringify(session);
            hideAuthOverlay();
            startLiveFeed();
        } else {
            showAuthOverlay();
        }
    }
    setupSearchEngine();
    setupInterfaceActions();
}

// 5. نظام شاشة الحسابات والتحكم بالتبويبات والـ Authentication
window.handleEmailAuth = async function(event, mode) {
    event.preventDefault();
    showToast("جاري معالجة الطلب...", "info");

    if (mode === 'login') {
        const email = document.getElementById("login-email").value.trim();
        const pass = document.getElementById("login-password").value;

        if (isFirebaseReady) {
            try {
                await signInWithEmailAndPassword(auth, email, pass);
                showToast("تم تسجيل الدخول بنجاح!");
            } catch (err) {
                showToast("خطأ: البريد أو كلمة المرور غير صحيحة", "error");
            }
        } else {
            // محاكاة تسجيل الدخول محلياً
            const users = JSON.parse(localStorage.getItem("local_users"));
            const match = users.find(u => u.email === email && u.pass === pass);
            if (match) {
                appUser = { uid: match.uid, name: match.name, email: match.email, avatar: DEFAULT_AVATAR, bio: match.bio || "مرحباً بك!" };
                sessionStorage.setItem("local_session", JSON.stringify(appUser));
                hideAuthOverlay();
                startLiveFeed();
                showToast("تم الدخول للوضع المحلي التجريبي بنجاح!");
            } else {
                showToast("المستخدم غير موجود محلياً! قم بإنشاء حساب أولاً.", "error");
            }
        }
    } else if (mode === 'register') {
        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const pass = document.getElementById("reg-password").value;

        if (pass.length < 6) {
            showToast("يجب أن تكون كلمة المرور 6 أحرف فأكثر", "error");
            return;
        }

        if (isFirebaseReady) {
            try {
                const cred = await createUserWithEmailAndPassword(auth, email, pass);
                appUser = { uid: cred.user.uid, name: name, email: email, avatar: DEFAULT_AVATAR, bio: "حساب جديد موثق" };
                await setDoc(doc(db, "users", cred.user.uid), appUser);
                showToast("تم إنشاء حسابك السحابي بنجاح!");
            } catch (err) {
                showToast("خطأ البريد مستخدم بالفعل أو غير صالح", "error");
            }
        } else {
            // محاكاة إنشاء حساب محلياً
            const users = JSON.parse(localStorage.getItem("local_users"));
            if (users.some(u => u.email === email)) {
                showToast("هذا البريد مسجل محلياً بالفعل!", "error");
                return;
            }
            const newUid = "local_" + Date.now();
            const newUser = { uid: newUid, name: name, email: email, pass: pass, avatar: DEFAULT_AVATAR, bio: "مطور طموح" };
            users.push(newUser);
            localStorage.setItem("local_users", JSON.stringify(users));
            appUser = newUser;
            sessionStorage.setItem("local_session", JSON.stringify(appUser));
            hideAuthOverlay();
            startLiveFeed();
            showToast("تم إنشاء الحساب المحلي بنجاح! جرب النشر الآن.");
        }
    }
};

// استرجاع كلمة المرور
window.handleResetPassword = async function() {
    const email = prompt("أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين:");
    if (!email) return;

    if (isFirebaseReady) {
        try {
            await sendPasswordResetEmail(auth, email);
            showToast("تم إرسال رابط استعادة المرور لبريدك.");
        } catch (e) {
            showToast("تعذر إرسال الرابط، تأكد من البريد", "error");
        }
    } else {
        showToast("تنبيه: ميزة البريد تتطلب ربط مفاتيح Firebase الحقيقية أونلاين.", "error");
    }
};

// 6. محرك التايملاين وبث المنشورات الفوري (Live Timeline Engine)
function startLiveFeed() {
    const feed = document.getElementById("app-timeline-feed");
    if (!feed) return;

    if (isFirebaseReady) {
        const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
        onSnapshot(q, (snapshot) => {
            renderTimelineCards(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
    } else {
        // تحديث محلي دوري يحاكي الـ Live Feed
        const renderLocal = () => {
            const posts = JSON.parse(localStorage.getItem("local_posts")) || [];
            renderTimelineCards(posts.sort((a,b) => b.createdAt - a.createdAt));
        };
        renderLocal();
        window.refreshLocalTimeline = renderLocal; // إتاحة التحديث الفوري عند النشر
    }
}

function renderTimelineCards(postsArray) {
    const feed = document.getElementById("app-timeline-feed");
    if (postsArray.length === 0) {
        feed.innerHTML = `<p style="text-align:center; color:var(--text-secondary); padding:40px; font-size:13px;">التايملاين نظيف ومصفّر بالكامل، شاركنا منشورك الأول الآن يا هندسة! 🚀</p>`;
        return;
    }

    feed.innerHTML = postsArray.map(post => {
        const hasLiked = post.likedBy && post.likedBy.includes(appUser?.uid);
        const textWithHashtags = post.text.replace(/#(\w+)/g, '<span class="hashtag" style="color:var(--accent-color); font-weight:700; cursor:pointer;" onclick="filterByTag(\'$1\')">#$1</span>');
        
        return `
            <div class="feed-card" style="background:var(--bg-surface); border:1px solid var(--border-color); border-radius:var(--radius-lg); padding:16px; margin-bottom:16px;">
                <div class="card-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div class="card-user-info" style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.location.href='profile.html?uid=${post.authorId}'">
                        <img class="user-avatar" src="${post.authorAvatar || DEFAULT_AVATAR}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
                        <div class="post-meta">
                            <h4 style="font-size:14px; font-weight:700;">${post.authorName}</h4>
                            <span style="font-size:11px; color:var(--text-secondary);">منذ فترة وجيزة</span>
                        </div>
                    </div>
                </div>
                <p class="post-body-text" style="font-size:14px; margin-bottom:12px; white-space:pre-wrap;">${textWithHashtags}</p>
                <div class="card-actions-bar" style="display:flex; gap:20px; border-top:1px solid var(--border-color); padding-top:10px;">
                    <button class="action-btn" style="background:none; border:none; cursor:pointer; color:${hasLiked ? 'var(--error-color)' : 'var(--text-secondary)'}" onclick="likePostEngine('${post.id}')">
                        ❤️ <span>${post.likesCount || 0}</span> تفاعل
                    </button>
                    <button class="action-btn" style="background:none; border:none; color:var(--text-secondary);">💬 التعليقات</button>
                </div>
            </div>
        `;
    }).join('');
}

// 7. ميزة إنشاء ونشر مشاركة جديدة
window.publishPost = async function() {
    const textarea = document.getElementById("post-textarea");
    const text = textarea.value.trim();

    if (!text) {
        showToast("يرجى كتابة نص المنشور أولاً!", "error");
        return;
    }

    const newPost = {
        text: text,
        authorId: appUser.uid,
        authorName: appUser.name,
        authorAvatar: appUser.avatar || DEFAULT_AVATAR,
        likesCount: 0,
        likedBy: [],
        createdAt: isFirebaseReady ? new Date() : Date.now()
    };

    if (isFirebaseReady) {
        await addDoc(collection(db, "posts"), newPost);
    } else {
        const posts = JSON.parse(localStorage.getItem("local_posts"));
        newPost.id = "post_" + Date.now();
        posts.push(newPost);
        localStorage.setItem("local_posts", JSON.stringify(posts));
        if (window.refreshLocalTimeline) window.refreshLocalTimeline();
    }

    textarea.value = "";
    showToast("تم نشر مشاركتك بنجاح!");
};

// 8. محرك الإعجابات الهجين (Like Engine)
window.likePostEngine = async function(postId) {
    if (!appUser) return;
    
    if (isFirebaseReady) {
        const postRef = doc(db, "posts", postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const data = postSnap.data();
            const liked = data.likedBy && data.likedBy.includes(appUser.uid);
            await updateDoc(postRef, {
                likedBy: liked ? arrayRemove(appUser.uid) : arrayUnion(appUser.uid),
                likesCount: increment(liked ? -1 : 1)
            });
        }
    } else {
        const posts = JSON.parse(localStorage.getItem("local_posts"));
        const post = posts.find(p => p.id === postId);
        if (post) {
            const idx = post.likedBy.indexOf(appUser.uid);
            if (idx > -1) {
                post.likedBy.splice(idx, 1);
                post.likesCount--;
            } else {
                post.likedBy.push(appUser.uid);
                post.likesCount++;
            }
            localStorage.setItem("local_posts", JSON.stringify(posts));
            if (window.refreshLocalTimeline) window.refreshLocalTimeline();
        }
    }
};

// 9. محرك البحث والتبديل المرئي للواجهات
function setupSearchEngine() {
    const input = document.getElementById("global-search-input");
    if (!input) return;

    input.addEventListener("input", (e) => {
        const val = e.target.value.trim().toLowerCase();
        const posts = JSON.parse(localStorage.getItem("local_posts")) || [];
        
        if(!val) {
            startLiveFeed();
            return;
        }
        
        // تصفية فورية مبنية على الهاشتاجات أو الكلمات الدلالية أو الأسماء
        const filtered = posts.filter(p => p.text.toLowerCase().includes(val) || p.authorName.toLowerCase().includes(val));
        renderTimelineCards(filtered);
    });
}

function setupInterfaceActions() {
    const btn = document.getElementById("publish-post-btn");
    if (btn) btn.addEventListener("click", window.publishPost);
    
    // إغلاق وتسجيل الخروج التام
    const logout = document.getElementById("logout-btn");
    if (logout) {
        logout.addEventListener("click", () => {
            if (isFirebaseReady) signOut(auth);
            sessionStorage.clear();
            window.location.reload();
        });
    }
}

// أدوات الواجهة المساعدة النظيفة
function showAuthOverlay() { const o = document.getElementById("auth-screen-overlay"); if(o) o.style.display = "flex"; }
function hideAuthOverlay() { const o = document.getElementById("auth-screen-overlay"); if(o) o.style.display = "none"; }

function showToast(msg, type = "success") {
    const toast = document.getElementById("system-toast");
    const txt = document.getElementById("toast-text");
    if (!toast || !txt) return;
    txt.innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3500);
}
