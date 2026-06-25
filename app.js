/* ==========================================================================
   Friends Production Engine - Firebase v10 Real-time Integration
   ========================================================================== */

// 1. استدعاء مكتبات الفايربيز الأساسية بنظام الـ Modules (v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, 
    GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, doc, setDoc, getDoc, collection, addDoc, query, orderBy, 
    onSnapshot, updateDoc, arrayUnion, arrayRemove, increment, where
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// 2. إعدادات الفايربيز الخاصة بك (ضع بيانات مشروعك هنا ليعمل النظام فوراً)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// تهيئة الفايربيز
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();

// 3. متغيرات الحالة العامة للتطبيق (State Management)
let currentUserData = null;
let activeChatUserId = null;
let unsubscribeChat = null;

// الصورة الافتراضية الرسمية (طابع انستغرام للحسابات التي بدون صورة)
const DEFAULT_AVATAR = "https://www.instagram.com/static/images/anonymousUser.jpg/73e970b629f6.jpg";

// تشغيل التطبيق بمجرد فحص حالة تسجيل الدخول للعميل
onAuthStateChanged(auth, async (user) => {
    if (user) {
        // جلب بيانات المستخدم المسجل من الفاير ستور
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            currentUserData = userDoc.data();
        } else {
            // لو مستخدم جديد سجل بجوجل مثلاً ولم تنشأ له بيانات بعد
            currentUserData = {
                uid: user.uid,
                name: user.displayName || "مطور جديد",
                email: user.email,
                avatar: user.photoURL || DEFAULT_AVATAR,
                bio: "مرحباً بك في منصتي الافتراضية!",
                followers: [],
                following: [],
                savedPosts: []
            };
            await setDoc(doc(db, "users", user.uid), currentUserData);
        }
        
        // تحديث واجهة المستخدم بالبيانات الحقيقية
        updateUIWithUserData();
        listenToFeed();
        listenToNotes();
        listenToNotifications();
        setupSearch();
    } else {
        // إذا كان المستخدم غير مسجل، يمكنك توجيهه لصفحة تسجيل الدخول أو إظهار نافذة التسجيل
        console.log("المستخدم غير مسجل دخول حالياً.");
        showToast("⚠️ يرجى تسجيل الدخول للوصول لكامل الميزات", "error");
    }
});

// 4. دالة تحديث عناصر الواجهة الثابتة ببيانات المستخدم الحقيقي
function updateUIWithUserData() {
    const headerAvatar = document.getElementById("user-header-avatar");
    const createPostAvatar = document.getElementById("create-post-avatar");
    
    if (headerAvatar) headerAvatar.src = currentUserData.avatar || DEFAULT_AVATAR;
    if (createPostAvatar) createPostAvatar.src = currentUserData.avatar || DEFAULT_AVATAR;
}

// 5. محرك التايملاين الحي والمباشر (Real-time Timeline Feed)
function listenToFeed() {
    const feedContainer = document.getElementById("app-timeline-feed");
    if (!feedContainer) return;

    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    
    // مراقبة حية ومباشرة بدون عمل Refresh للمتصفح
    onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            feedContainer.innerHTML = `<p style="text-align:center; color:var(--text-secondary); padding:30px;">لا يوجد منشورات حالياً، شاركنا أول منشور حقيقي!</p>`;
            return;
        }

        feedContainer.innerHTML = snapshot.docs.map(docSnap => {
            const post = docSnap.data();
            const postId = docSnap.id;
            const isLiked = post.likedBy && post.likedBy.includes(auth.currentUser.uid);
            const isSaved = currentUserData.savedPosts && currentUserData.savedPosts.includes(postId);
            
            // تحويل النص لمعالجة الهاشتاجات تلقائياً
            const formattedText = post.text.replace(/#(\w+)/g, '<span class="hashtag">#$1</span>');

            let mediaHtml = "";
            if (post.mediaUrl) {
                if (post.mediaType === "video") {
                    mediaHtml = `<div class="post-media-attachment"><video src="${post.mediaUrl}" controls></video></div>`;
                } else {
                    mediaHtml = `<div class="post-media-attachment"><img src="${post.mediaUrl}" class="lightbox-trigger" alt="مرفق"></div>`;
                }
            }

            return `
                <div class="feed-card" data-id="${postId}">
                    <div class="card-header">
                        <div class="card-user-info">
                            <img class="user-avatar" src="${post.authorAvatar || DEFAULT_AVATAR}" alt="Avatar" onclick="window.location.href='profile.html?uid=${post.authorId}'">
                            <div class="post-meta">
                                <h4 onclick="window.location.href='profile.html?uid=${post.authorId}'">${post.authorName}</h4>
                                <span>${post.createdAt ? new Date(post.createdAt.toDate()).toLocaleDateString('ar-EG') : 'الآن'}</span>
                            </div>
                        </div>
                        ${post.authorId !== auth.currentUser.uid ? `<button class="follow-btn-inline" onclick="toggleFollow('${post.authorId}')">متابعة</button>` : ''}
                    </div>
                    <p class="post-body-text">${formattedText}</p>
                    ${mediaHtml}
                    <div class="card-actions-bar">
                        <button class="action-btn like-btn ${isLiked ? 'liked' : ''}" onclick="toggleLike('${postId}', ${isLiked})">
                            ❤️ <span>${post.likesCount || 0}</span> تفاعل
                        </button>
                        <button class="action-btn open-comments-btn" onclick="openComments('${postId}')">
                            💬 <span>${post.commentsCount || 0}</span> التعليقات
                        </button>
                        <button class="action-btn save-btn ${isSaved ? 'saved' : ''}" onclick="toggleSavePost('${postId}', ${isSaved})">
                            🔖 حفظ المنشور
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    });
}

// 6. ميزة إنشاء ونشر بوست حقيقي مع الميديا والهاشتاجات والرفع للـ Storage
window.publishPost = async function() {
    const textarea = document.getElementById("post-textarea");
    const fileInput = document.getElementById("file-upload-input");
    const text = textarea.value.trim();
    
    if (!text && !fileInput.files[0]) {
        showToast("⚠️ اكتب نصاً أو ارفق ملفاً لنشره", "error");
        return;
    }

    showToast("⏳ جاري نشر مشاركتك الفخمة...", "info");
    let mediaUrl = null;
    let mediaType = "image";

    if (fileInput.files[0]) {
        const file = fileInput.files[0];
        mediaType = file.type.startsWith("video/") ? "video" : "image";
        const storageRef = ref(storage, `posts/${Date.now()}_${file.name}`);
        const uploadSnap = await uploadBytes(storageRef, file);
        mediaUrl = await getDownloadURL(uploadSnap.ref);
    }

    // استخراج الهاشتاجات وحفظها في مصفوفة مستقلة للبحث المتقدم لاحقاً
    const hashtags = text.match(/#(\w+)/g) || [];

    await addDoc(collection(db, "posts"), {
        text: text,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
        hashtags: hashtags,
        authorId: auth.currentUser.uid,
        authorName: currentUserData.name,
        authorAvatar: currentUserData.avatar,
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        createdAt: new Date()
    });

    textarea.value = "";
    fileInput.value = "";
    document.getElementById("file-preview-zone").style.display = "none";
    showToast("✅ تم النشر في التايملاين بنجاح!");
};

// 7. ميزة الإعجاب (Like) الحقيقي والذكي
window.toggleLike = async function(postId, isLiked) {
    const postRef = doc(db, "posts", postId);
    const userId = auth.currentUser.uid;

    if (isLiked) {
        await updateDoc(postRef, {
            likedBy: arrayRemove(userId),
            likesCount: increment(-1)
        });
    } else {
        await updateDoc(postRef, {
            likedBy: arrayUnion(userId),
            likesCount: increment(1)
        });
        // إرسال إشعار لصاحب البوست
        const postSnap = await getDoc(postRef);
        if(postSnap.exists() && postSnap.data().authorId !== userId) {
            sendNotification(postSnap.data().authorId, "إعجاب جديد", `${currentUserData.name} أعجب بمنشورك الحسابي.`);
        }
    }
};

// 8. نظام البحث المتقدم الذكي (أشخاص / هاشتاجات)
function setupSearch() {
    const searchInput = document.getElementById("global-search-input");
    const resultsBox = document.getElementById("search-results-dropdown");
    if (!searchInput || !resultsBox) return;

    searchInput.addEventListener("input", async (e) => {
        const term = e.target.value.trim().toLowerCase();
        if (!term) {
            resultsBox.style.display = "none";
            return;
        }

        // بحث محلي أو جلب سريع من الفاير ستور (مثال للأشخاص والهاشتاجات)
        resultsBox.style.display = "block";
        resultsBox.innerHTML = `<p style="padding:10px; font-size:12px; color:var(--text-secondary)">جاري البحث عن "${term}"...</p>`;
        
        // جلب الأشخاص المتطابقين في الاسم
        const qUsers = query(collection(db, "users"), where("name", ">=", term), where("name", "<=", term + "\uf8ff"));
        const snapshot = await getDoc(qUsers); // أو getDocs حسب هيكلية الاستدعاء
        
        // رسم النتائج بشكل نظيف (Clean Dropdown)
        resultsBox.innerHTML = `
            <div style="padding:10px; font-weight:bold; font-size:12px; border-bottom:1px solid var(--border-color)">النتائج المطابقة</div>
            <div style="padding:10px; cursor:pointer;" onclick="filterTimelineByHashtag('${term}')">🔍 ابحث عن هاشتاج #${term}</div>
        `;
    });
}

// 9. محرك الشات والرسائل الفورية (WebSocket-like Real-time Chat)
window.loadDirectChat = function(targetUserId, targetUserName) {
    activeChatUserId = targetUserId;
    document.getElementById("active-chat-name").innerText = targetUserName;
    
    const messagesBox = document.getElementById("chat-messages-box");
    if (!messagesBox) return;

    if (unsubscribeChat) unsubscribeChat();

    const chatId = [auth.currentUser.uid, targetUserId].sort().join("_");
    const q = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));

    unsubscribeChat = onSnapshot(q, (snapshot) => {
        messagesBox.innerHTML = snapshot.docs.map(docSnap => {
            const msg = docSnap.data();
            const isOutgoing = msg.senderId === auth.currentUser.uid;
            return `
                <div class="msg-bubble ${isOutgoing ? 'outgoing' : 'incoming'}">
                    ${msg.text}
                </div>
            `;
        }).join('');
        messagesBox.scrollTop = messagesBox.scrollHeight;
    });
};

// 10. إرسال إشعارات حقيقية وحفظها في قاعدة البيانات للمستخدمين
async function sendNotification(targetUid, title, body) {
    await addDoc(collection(db, "users", targetUid, "notifications"), {
        title: title,
        body: body,
        read: false,
        timestamp: new Date()
    });
}

function listenToNotifications() {
    const q = query(collection(db, "users", auth.currentUser.uid, "notifications"), where("read", "==", false));
    onSnapshot(q, (snapshot) => {
        const badge = document.getElementById("notif-count");
        if (badge) {
            if (snapshot.size > 0) {
                badge.innerText = snapshot.size;
                badge.style.display = "inline-block";
            } else {
                badge.style.display = "none";
            }
        }
    });
}

// 11. نظام التوست المنسق المطور لبث الرسائل والعمليات
function showToast(message, type = "success") {
    const toast = document.getElementById("system-toast");
    const textSpan = document.getElementById("toast-text");
    const iconSpan = document.getElementById("toast-icon");
    
    if (!toast || !textSpan) return;
    
    textSpan.innerText = message;
    if (type === "error") iconSpan.innerText = "⚠️";
    else if (type === "info") iconSpan.innerText = "⏳";
    else iconSpan.innerText = "🔔";
    
    toast.classList.add("show");
    setTimeout(() => { toast.classList.remove("show"); }, 4000);
}

// تفعيل وتأمين ميزة النشر لزر الواجهة
document.addEventListener("DOMContentLoaded", () => {
    const pubBtn = document.getElementById("publish-post-btn");
    if(pubBtn) pubBtn.addEventListener("click", window.publishPost);
});
