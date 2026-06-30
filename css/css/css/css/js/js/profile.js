/* ==========================================================================
   Friends Platform - Profile & Enterprise Pro Marketplace Engine (2026)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, doc, getDoc, updateDoc, arrayUnion, collection, query, where, orderBy, onSnapshot 
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

let profileUserUid = null;
let isOwnProfile = false;

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "login.html";
        } else {
            // نأخذ الـ UID من الرابط لو كنا نتصفح حساب شخص آخر، أو نأخذ UID المستخدم الحالي
            const urlParams = new URLSearchParams(window.location.search);
            profileUserUid = urlParams.get("id") || user.uid;
            isOwnProfile = (profileUserUid === user.uid);
            
            loadProfileSystemData();
            listenToUserPosts();
            setupTabsBehavior();
            setupMarketplaceModal();
        }
    });
});

/* ================= جلب بيانات الحساب وفحص نوعه (عادي أم احترافي) ================= */
async function loadProfileSystemData() {
    try {
        const userDocRef = doc(db, "users", profileUserUid);
        const snap = await getDoc(userDocRef);
        
        if(!snap.exists()) return;
        const data = snap.data();

        // 1. تعبئة البيانات الأساسية الشاملة للواجهة
        document.getElementById("profile-name").innerText = data.name || "صانع محتوى";
        document.getElementById("top-nav-name").innerText = data.name || "صانع محتوى";
        document.getElementById("profile-bio").innerText = data.bio || "لا توجد نبذة شخصية بعد.";
        document.getElementById("user-profile-avatar").src = data.avatar || "https://www.gravatar.com/avatar/?d=mp";
        document.getElementById("followers-count").innerText = (data.followers || []).length;
        document.getElementById("following-count").innerText = (data.following || []).length;

        // 2. ميزة التوثيق المجاني المبني على الجدارة والحقيقة
        if (data.isVerified) {
            document.getElementById("merit-badge").style.display = "inline-block";
        }

        // 3. إدارة منطقة الأزرار (أزرار التحكم)
        const actionArea = document.getElementById("profile-action-area");
        if (isOwnProfile) {
            actionArea.innerHTML = `<button class="base-btn btn-secondary" onclick="window.location.href='edit-profile.html'">⚙️ تعديل الملف</button>`;
        } else {
            actionArea.innerHTML = `<button id="follow-btn" class="base-btn btn-accent">تابع الحساب</button>`;
        }

        /* 4. التحقق الحاسم من ميزة المتجر للأحسابات الاحترافية فقط */
        handleMarketplaceAccess(data.isProAccount || data.hasMarketplace, data.marketplaceServices || []);

    } catch (err) {
        console.error("خطأ في جلب بيانات الملف الشخصي:", err);
    }
}

/* ================= التحكم بظهور المتجر حسب نوع الحساب ================= */
function handleMarketplaceAccess(isPro, servicesList) {
    const lockedState = document.getElementById("market-locked-state");
    const activeState = document.getElementById("market-active-state");
    const gridContainer = document.getElementById("services-grid-container");

    if (!isPro) {
        // إذا كان الحساب عادي: نقفل المتجر ونعرض كارت الترقية (فقط إذا كان هذا ملفك الشخصي)
        activeState.style.display = "none";
        lockedState.style.display = "block";
        
        const upgradeBtn = document.getElementById("upgrade-to-pro-btn");
        if (upgradeBtn) {
            if (!isOwnProfile) {
                // لو زائر بيتصفح حساب عادي، ملوش ميزة متجر، نخفي التبويب بالكامل أو نكتب رسالة
                lockedState.innerHTML = `<h3>هذا المستخدم لديه حساب عادي ولا يمتلك متجراً حالياً.</h3>`;
            } else {
                upgradeBtn.onclick = async () => {
                    upgradeBtn.disabled = true;
                    // كود الترقية المجانية الفورية للحساب الاحترافي لايف
                    await updateDoc(doc(db, "users", auth.currentUser.uid), {
                        isProAccount: true,
                        hasMarketplace: true
                    });
                    showToastNotification("مبروك! تم ترقية حسابك إلى احترافي وتفعيل المتجر 🚀", "✅");
                    loadProfileSystemData(); // إعادة تحميل الواجهة
                };
            }
        }
    } else {
        // إذا كان الحساب احترافي: نفتح المتجر فوراً ويعرض المنتجات والخدمات الرقمية
        lockedState.style.display = "none";
        activeState.style.display = "block";

        // إذا كان الزائر يتصفح حساب محترف آخر، نخفي عنه زرار "إضافة خدمة جديدة" الخاص بالمالك
        if(!isOwnProfile) {
            document.getElementById("open-add-service-modal").style.display = "none";
        }

        // عرض شبكة الخدمات المدرجة
        if (servicesList.length === 0) {
            gridContainer.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color:var(--text-secondary); padding:30px;">المتجر فارغ حالياً، لم يتم إدراج أي خدمات بعد.</p>`;
        } else {
            gridContainer.innerHTML = servicesList.map(srv => `
                <div class="service-product-card animate-fade-in-up">
                    <div class="srv-card-meta">
                        <span class="srv-tag-0">عمولة 0%</span>
                        <span class="srv-price-tag">${srv.price} SAR</span>
                    </div>
                    <h4>${srv.title}</h4>
                    <p>${srv.desc}</p>
                    <button class="base-btn btn-accent" style="width:100%; font-size:12px; margin-top:10px;" onclick="alert('سيتم توجيهك لرابط الشراء أو محادثة البائع مباشرة الحين!')">طلب الخدمة الآن 🛒</button>
                </div>
            `).join("");
        }
    }
}

/* ================= التعامل مع النوافذ المنبثقة للمتجر الاحترافي ================= */
function setupMarketplaceModal() {
    const modal = document.getElementById("add-service-modal");
    const openBtn = document.getElementById("open-add-service-modal");
    const closeBtn = document.getElementById("close-comments-btn") || document.getElementById("close-service-modal");
    const form = document.getElementById("add-service-form");

    if(openBtn) openBtn.onclick = () => modal.classList.add("open");
    if(closeBtn) closeBtn.onclick = () => modal.classList.remove("open");

    if (form) {
        form.onsubmit = async () => {
            const title = document.getElementById("srv-title").value.trim();
            const price = document.getElementById("srv-price").value.trim();
            const desc = document.getElementById("srv-desc").value.trim();

            if(!title || !price || !desc) return;

            const submitBtn = document.getElementById("submit-new-service-btn");
            submitBtn.disabled = true;

            try {
                const newService = { title, price, desc, createdAt: new Date().toISOString() };
                
                // إضافة الخدمة للمصفوفة الاحترافية داخل الفايربيز للـ User
                await updateDoc(doc(db, "users", auth.currentUser.uid), {
                    marketplaceServices: arrayUnion(newService)
                });

                modal.classList.remove("open");
                form.reset();
                showToastNotification("تم نشر خدمتك الاحترافية في متجرك بنجاح لايف! 🎯", "✅");
                loadProfileSystemData(); // إنعاش الداتا
            } catch (e) {
                alert("فشلت عملية النشر في المتجر");
            }
            submitBtn.disabled = false;
        };
    }
}

/* ================= استماع وجلب منشورات صاحب الحساب فقط ================= */
function listenToUserPosts() {
    const q = query(collection(db, "posts"), where("authorId", "==", profileUserUid), orderBy("createdAt", "desc"));
    
    onSnapshot(q, (snapshot) => {
        const posts = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        document.getElementById("top-nav-posts-count").innerText = `${posts.length} منشور`;
        
        const container = document.getElementById("user-posts-container");
        if (posts.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:40px; color:var(--text-secondary);">لا توجد أي منشورات من هذا المستخدم بعد.</p>`;
            return;
        }

        container.innerHTML = posts.map(p => `
            <div class="profile-feed-card animate-fade-in-up">
                <div class="pf-body">${p.text}</div>
            </div>
        `).join("");
    });
}

/* ================= التنقل السلس بين التبويبات ================= */
function setupTabsBehavior() {
    const postsBtn = document.getElementById("tab-posts-btn");
    const marketBtn = document.getElementById("tab-market-btn");
    const postsView = document.getElementById("profile-posts-view");
    const marketView = document.getElementById("profile-market-view");

    if(postsBtn && marketBtn) {
        postsBtn.onclick = () => {
            postsBtn.classList.add("active"); marketBtn.classList.remove("active");
            postsView.classList.add("active"); marketView.classList.remove("active");
        };
        marketBtn.onclick = () => {
            marketBtn.classList.add("active"); postsBtn.classList.remove("active");
            marketView.classList.add("active"); postsView.classList.remove("active");
        };
    }
}

function showToastNotification(msg, icon) {
    const toast = document.getElementById("app-toast");
    if(!toast) return;
    toast.querySelector(".toast-message-text").innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 4000);
}
