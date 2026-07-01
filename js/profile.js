/* ==========================================================================
   Friends Platform - Advanced Profile, Marketplace & Follow Engine
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA5SS93zdj5N8oBMmjPgWvfSohdSBIRQ8c",
  authDomain: "friends7777.firebaseapp.com",
  projectId: "friends7777"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let myUid = null;
let targetProfileUid = null;
let targetUserData = null;

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }
        myUid = user.uid;

        // تحديد إذا كنا نتصفح بروفايل شخص آخر أو بروفايلي الشخصي عبر الرابط
        const urlParams = new URLSearchParams(window.location.search);
        targetProfileUid = urlParams.get('id') || myUid;

        await renderProfileData();
        setupLogout();
        setupBasicSettingsHandler();
        setupMarketplaceHandler();
        setupAvatarModalHandlers();
    });
});

/* ================= جلب وعرض بيانات البروفايل لايف ================= */
async function renderProfileData() {
    const docSnap = await getDoc(doc(db, "users", targetProfileUid));
    if (!docSnap.exists()) return;
    
    targetUserData = docSnap.data();
    const isOwner = (myUid === targetProfileUid);

    // سحب الداتا الأساسية
    const avatarUrl = targetUserData.avatar || "https://www.gravatar.com/avatar/?d=mp";
    document.getElementById("user-profile-avatar-img").src = avatarUrl;
    document.getElementById("modal-image-preview").src = avatarUrl;
    document.getElementById("profile-display-name").innerText = targetUserData.name || "عضو مجتمعي";
    document.getElementById("profile-display-bio").innerText = targetUserData.bio || "لم يتم تعيين بايو أو وصف شخصي حتى الآن.";

    // تعبئة حقول تعديل الإعدادات بقيمها الحالية لو أنا المالك
    if (isOwner) {
        document.getElementById("setting-input-name").value = targetUserData.name || "";
        document.getElementById("setting-input-bio").value = targetUserData.bio || "";
        document.getElementById("pro-merchant-control-panel").style.display = "block";
        document.getElementById("settings-section-card").style.display = "block";
    } else {
        document.getElementById("pro-merchant-control-panel").style.display = "none";
        document.getElementById("settings-section-card").style.display = "none";
    }

    // رص شارات التوثيق والمحترفين الجدارية
    let badgesHTML = targetUserData.isVerified ? `<span class="merit-badge-item text-verified">✓ موثق بجدارة</span>` : "";
    if (targetUserData.hasMarketplace || targetUserData.isProAccount) {
        badgesHTML += ` <span class="merit-badge-item text-pro">💼 حساب محترف</span>`;
    }
    document.getElementById("profile-badges-container").innerHTML = badgesHTML;

    // رص أزرار التحكم (تعديل الحساب أو زر المتابعة والمراسلة المباشرة)
    renderActionButtons(isOwner);
    
    // رص خدمات المتجر الحالية
    renderMarketServices();
}

/* ================= أزرار التحكم الديناميكية: متابعة / إلغاء متابعة / مراسلة ================= */
function renderActionButtons(isOwner) {
    const container = document.getElementById("profile-actions-wrapper");
    if (isOwner) {
        container.innerHTML = `
            <button class="base-btn btn-accent" onclick="document.getElementById('pro-merchant-control-panel').scrollIntoView({behavior:'smooth'});">إدارة متجري الرقمي 📥</button>
            <button class="base-btn" id="btn-toggle-pro-status">تفعيل وضع المحترفين مجاناً 🚀</button>
        `;
        
        document.getElementById("btn-toggle-pro-status").onclick = async () => {
            await updateDoc(doc(db, "users", myUid), { isProAccount: true, hasMarketplace: true });
            alert("مبروك! تم تفعيل وضع المحترفين والمتجر الرقمي بعمولة 0% على حسابك الحين! 🎉");
            renderProfileData();
        };
    } else {
        // حساب حالة المتابعة الحالية لمنع التكرار
        const myFollowers = targetUserData.followers || [];
        const isFollowing = myFollowers.includes(myUid);

        container.innerHTML = `
            <button id="btn-follow-trigger" class="base-btn ${isFollowing ? '' : 'btn-accent'}">
                ${isFollowing ? '🤝 إلغاء المتابعة الحين' : '➕ متابعة الحساب بجدارة'}
            </button>
            <button id="btn-direct-message-trigger" class="base-btn" style="background:#0076ff; color:#fff; border:none;">💬 مراسلة مباشرة لايف</button>
        `;

        // حدث المتابعة وإلغاء المتابعة اللحظي بضغطة واحدة الحين
        document.getElementById("btn-follow-trigger").onclick = async () => {
            const userRef = doc(db, "users", targetProfileUid);
            if (isFollowing) {
                await updateDoc(userRef, { followers: arrayRemove(myUid) });
                alert("تم إلغاء المتابعة.");
            } else {
                await updateDoc(userRef, { followers: arrayUnion(myUid) });
                alert("تمت المتابعة بنجاح! 🤝");
            }
            renderProfileData();
        };

        // زرار المراسلة المباشرة: يحولك للشات مع تمرير بيانات المستخدم في الرابط ليفتح الشات عنده فوراً
        document.getElementById("btn-direct-message-trigger").onclick = () => {
            window.location.href = `chat.html?target=${targetUserData.uid}&name=${encodeURIComponent(targetUserData.name)}`;
        };
    }
}

/* ================= تشغيل الإعدادات الأساسية (الاسم والبايو) ================= */
function setupBasicSettingsHandler() {
    const btn = document.getElementById("btn-save-basic-settings");
    if (!btn) return;
    btn.onclick = async () => {
        const nameInp = document.getElementById("setting-input-name").value.trim();
        const bioInp = document.getElementById("setting-input-bio").value.trim();
        if (!nameInp) return;

        btn.innerText = "جاري الحفظ...";
        await updateDoc(doc(db, "users", myUid), { name: nameInp, bio: bioInp });
        alert("تم حفظ الاسم والبايو بنجاح لايف! 🎉");
        btn.innerText = "حفظ الاسم والبايو الحين 💾";
        renderProfileData();
    };
}

/* ================= تشغيل وإصلاح تعديل خدمات المتجر الرقمي ================= */
function setupMarketplaceHandler() {
    const btn = document.getElementById("submit-new-service-btn");
    if (!btn) return;
    btn.onclick = async () => {
        const title = document.getElementById("market-service-title").value.trim();
        const price = document.getElementById("market-service-price").value.trim();
        if (!title || !price) return;

        btn.innerText = "جاري التحديث...";
        
        // تحديث مصفوفة الخدمات داخل حساب المستخدم في الفايربيز
        await updateDoc(doc(db, "users", myUid), {
            services: arrayUnion({
                id: Date.now().toString(),
                title: title,
                price: price
            })
        });

        document.getElementById("market-service-title").value = "";
        document.getElementById("market-service-price").value = "";
        btn.innerText = "نشر وتحديث الخدمة بالمتجر 🚀";
        alert("تمت إضافة الخدمة لمتجرك بنجاح وعمولة 0%! 💼");
        renderProfileData();
    };
}

/* ================= رص الخدمات الرقمية المضافة لايف ================= */
function renderMarketServices() {
    const container = document.getElementById("profile-services-grid-container");
    const services = targetUserData.services || [];

    if (services.length === 0) {
        container.innerHTML = `<p class="empty-market-text">لا توجد خدمات معروضة في المتجر حالياً.</p>`;
        return;
    }

    container.innerHTML = services.map(srv => `
        <div class="service-product-card animate-fade-in-up">
            <h4>${srv.title}</h4>
            <div class="price-tag-value">${srv.price} SAR</div>
            <button class="base-btn btn-accent" style="width:100%; margin-top:10px; font-size:12px; height:34px;" onclick="window.location.href='chat.html?target=${targetUserData.uid}&name=${encodeURIComponent(targetUserData.name)}'">طلب الخدمة الحين 📥</button>
        </div>
    `).join("");
}

/* ================= تشغيل النافذة المنبثقة للبروفايل (تكبير وتعديل وحذف الصورة) ================= */
function setupAvatarModalHandlers() {
    const avatarImg = document.getElementById("user-profile-avatar-img");
    const modal = document.getElementById("avatar-actions-modal");
    
    if(!avatarImg || !modal) return;

    avatarImg.onclick = () => {
        // السماح بالتعديل فقط إذا كان الحساب ملكي
        if (myUid === targetProfileUid) {
            document.getElementById("modal-avatar-url-input").value = targetUserData.avatar || "";
            modal.style.display = "flex";
        } else {
            // لو بروفايل شخص تاني، نكبر الصورة بس للرؤية الفخمة
            modal.style.display = "flex";
            document.getElementById("modal-avatar-url-input").style.display = "none";
            document.getElementById("btn-save-modal-avatar").style.display = "none";
            document.getElementById("btn-delete-modal-avatar").style.display = "none";
        }
    };

    // حفظ رابط الصورة الجديد
    document.getElementById("btn-save-modal-avatar").onclick = async () => {
        const url = document.getElementById("modal-avatar-url-input").value.trim();
        await updateDoc(doc(db, "users", myUid), { avatar: url });
        alert("تم تحديث صورة بروفايلك بنجاح! 📸");
        modal.style.display = "none";
        renderProfileData();
    };

    // حذف الصورة والعودة للصورة الافتراضية
    document.getElementById("btn-delete-modal-avatar").onclick = async () => {
        if(confirm("هل تريد حذف صورة البروفايل والعودة للافتراضية؟")) {
            await updateDoc(doc(db, "users", myUid), { avatar: "" });
            alert("تم حذف الصورة.");
            modal.style.display = "none";
            renderProfileData();
        }
    };
}

function setupLogout() {
    const btn = document.getElementById("btn-logout-action");
    if(btn) {
        btn.onclick = async () => {
            await signOut(auth);
            window.location.href = "index.html";
        };
    }
}
