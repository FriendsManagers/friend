/* ==========================================================================
   Friends Platform - Live Timeline & Anti-Filter Feed Engine (2026 Production)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc 
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

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "login.html";
        } else {
            // جلب ملف المستخدم الحالي لتركيب الصور والشارات الحقيقية بالهيدر
            await fetchCurrentUserInfo(user.uid);
            listenToAntiFilterTimeline();
            setupPostSubmission();
        }
    });
});

/* ================= جلب بيانات المستخدم لإنعاش الهيدر وصندوق النشر ================= */
async function fetchCurrentUserInfo(uid) {
    try {
        const snap = await getDoc(doc(db, "users", uid));
        if (snap.exists()) {
            currentUserData = snap.data();
            const avatarUrl = currentUserData.avatar || "https://www.gravatar.com/avatar/?d=mp";
            
            if(document.getElementById("header-user-avatar")) document.getElementById("header-user-avatar").src = avatarUrl;
            if(document.getElementById("publish-box-avatar")) document.getElementById("publish-box-avatar").src = avatarUrl;
        }
    } catch (e) {
        console.error("خطأ في تحميل بيانات الهيدر:", e);
    }
}

/* ================= معالجة وضخ منشور جديد على السيرفر لايف ================= */
function setupPostSubmission() {
    const btn = document.getElementById("timeline-publish-submit-btn");
    const textarea = document.getElementById("timeline-post-textarea");
    if (!btn || !textarea) return;

    btn.addEventListener("click", async () => {
        const text = textarea.value.trim();
        if (!text) return;

        btn.disabled = true;
        btn.innerText = "جاري النشر زمني...";

        try {
            // نشر الكود محتوياً على شارات التوثيق الجداري المأخوذة من حسابك الحقيقي
            await addDoc(collection(db, "posts"), {
                text: text,
                authorId: auth.currentUser.uid,
                authorName: currentUserData ? currentUserData.name : "عضو موثق",
                isVerified: currentUserData ? currentUserData.isVerified : true,
                isProAccount: currentUserData ? (currentUserData.isProAccount || currentUserData.hasMarketplace) : false,
                createdAt: serverTimestamp()
            });

            textarea.value = "";
            showTimelineToast("تم نشر محتواك ووصوله لـ 100% من المجتمع الحين! 🚀", "✅");
        } catch (error) {
            showTimelineToast("فشل النشر، يرجى فحص الشبكة والمحاولة مجدداً.", "❌");
        }
        btn.disabled = false;
        btn.innerText = "نشر المنشور فوراً";
    });
}

/* ================= ميزة الوصول الكامل: الاستماع للتايملاين الزمني النقي ================= */
function listenToAntiFilterTimeline() {
    const container = document.getElementById("timeline-live-feed-wrapper");
    // استعلام زمني صارم ومرتب تنازلياً من الأحدث للأقدم بدون تدخل خوارزميات حجب الدفع
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (posts.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:40px; color:var(--text-secondary); font-size:14px;">التايملاين فارغ حالياً، كن أول من ينشر الحين! ✨</p>`;
            return;
        }

        let feedHTML = "";

        posts.forEach((post, index) => {
            // حساب الوقت بذكاء
            const timeString = post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'}) : "الآن";
            
            // ميزة شارة التوثيق المجانية القائمة على الجدارة الحقيقية
            const verifiedBadge = post.isVerified ? `<span class="merit-verified-badge-inline" title="حساب موثق بجدارة وهوية حقيقية مجاناً">✓ موثق بجدارة</span>` : "";
            
            // شارة لتمييز الحساب الاحترافي صاحب المتجر الرقمي
            const proBadge = post.isProAccount ? `<span class="pro-account-badge-inline">💼 محترف</span>` : "";

            feedHTML += `
                <article class="timeline-post-card animate-fade-in-up">
                    <div class="post-card-header">
                        <img src="https://www.gravatar.com/avatar/${post.authorId}?d=mp&s=100" class="card-author-avatar" onclick="window.location.href='profile.html?id=${post.authorId}'">
                        <div class="card-author-meta-text">
                            <h4 onclick="window.location.href='profile.html?id=${post.authorId}'">${post.authorName} ${verifiedBadge} ${proBadge}</h4>
                            <span>تحديث زمني مباشر الحين ⏱️ ${timeString}</span>
                        </div>
                    </div>
                    <div class="post-card-body-content">
                        <p>${post.text}</p>
                    </div>
                </article>
            `;

            /* ================= ميزة البيئة النظيفة: حَقن إعلان فخم ومريح كل 15 منشوراً ================= */
            if ((index + 1) % 15 === 0) {
                feedHTML += `
                    <div class="clean-sponsored-card-box animate-fade-in-up">
                        <span class="sponsored-top-tag">إعلان نظيف ومريح لمجتمع Friends 🔒</span>
                        <h3>إعلان يدعم خصوصيتك الكاملة ولا يتتبع بياناتك</h3>
                        <p>مساحة متوازنة تظهر برفق، لا تؤثر على تصفحك ولا نبيع بياناتك للشركات الخارجية.</p>
                    </div>
                `;
            }
        });

        container.innerHTML = feedHTML;
    });
}

function showTimelineToast(msg, icon) {
    const toast = document.getElementById("app-toast");
    if(!toast) return;
    toast.querySelector(".toast-message-text").innerText = msg;
    toast.querySelector(".toast-icon").innerText = icon;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 4000);
}
