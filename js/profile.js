/* js/profile.js */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { apiKey: "AIzaSyA5SS93zdj5N8oBMmjPgWvfSohdSBIRQ8c", authDomain: "friends7777.firebaseapp.com", projectId: "friends7777" };
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let myUid = null;
let targetProfileUid = null;

onAuthStateChanged(auth, async (user) => {
    if (!user) { window.location.href = "index.html"; return; }
    myUid = user.uid;
    const urlParams = new URLSearchParams(window.location.search);
    targetProfileUid = urlParams.get('id') || myUid;

    if(window.location.hash === "#store") {
        setTimeout(() => document.getElementById("store-section-tab").scrollIntoView({behavior:'smooth'}), 500);
    }

    await renderProfileData();
    setupBasicSettingsHandler();
    setupMarketplaceHandler();
    setupAvatarModalHandlers();
});

async function renderProfileData() {
    const docSnap = await getDoc(doc(db, "users", targetProfileUid));
    if (!docSnap.exists()) return;
    const data = docSnap.data();

    document.getElementById("user-profile-avatar-img").src = data.avatar || "https://www.gravatar.com/avatar/?d=mp";
    document.getElementById("profile-display-name").innerText = data.name || "عضو مجتمعي حُر";
    document.getElementById("profile-display-bio").innerText = data.bio || "لا يوجد وصف حتى الآن.";

    if (myUid === targetProfileUid) {
        document.getElementById("setting-input-name").value = data.name || "";
        document.getElementById("setting-input-bio").value = data.bio || "";
        document.getElementById("pro-merchant-control-panel").style.display = "block";
    }

    const container = document.getElementById("profile-services-grid-container");
    const services = data.services || [];
    if(services.length === 0) {
        container.innerHTML = `<p style="grid-column: span 3; text-align:center; color:var(--text-secondary); padding:20px;">المتجر فارغ حالياً.</p>`;
        return;
    }

    container.innerHTML = services.map(srv => `
        <div class="insta-service-card">
            <strong style="font-size:13px; display:block; margin-bottom:6px; color:var(--text-primary);">${srv.title}</strong>
            <span style="color:var(--accent-color); font-weight:bold; font-size:14px;">${srv.price} SAR</span>
        </div>
    `).join("");
}

function setupBasicSettingsHandler() {
    const btn = document.getElementById("btn-save-basic-settings");
    if(!btn) return;
    btn.onclick = async () => {
        const name = document.getElementById("setting-input-name").value.trim();
        const bio = document.getElementById("setting-input-bio").value.trim();
        if(!name) return;
        btn.innerText = "جاري الحفظ...";
        await updateDoc(doc(db, "users", myUid), { name: name, bio: bio });
        
        // تحديث الواجهة لايف فوراً
        document.getElementById("profile-display-name").innerText = name;
        document.getElementById("profile-display-bio").innerText = bio || "لا يوجد وصف حتى الآن.";
        
        alert("تم تحديث الاسم والبيانات بنجاح! 🎉");
        document.getElementById("settings-card").style.display = 'none';
        btn.innerText = "حفظ التعديلات 💾";
    };
}

function setupMarketplaceHandler() {
    const btn = document.getElementById("submit-new-service-btn");
    if(!btn) return;
    btn.onclick = async () => {
        const title = document.getElementById("market-service-title").value.trim();
        const price = document.getElementById("market-service-price").value.trim();
        if(!title || !price) return;
        btn.innerText = "جاري الرفع...";
        await updateDoc(doc(db, "users", myUid), {
            services: arrayUnion({ id: Date.now().toString(), title: title, price: price })
        });
        document.getElementById("market-service-title").value = "";
        document.getElementById("market-service-price").value = "";
        btn.innerText = "نشر وتحديث في المتجر فوراً";
        alert("تم إضافة المنتج لمتجرك الرقمي بنجاح! 💼");
        renderProfileData();
    };
}

function setupAvatarModalHandlers() {
    const img = document.getElementById("user-profile-avatar-img");
    const modal = document.getElementById("avatar-actions-modal");
    if(!img || !modal) return;
    img.onclick = () => {
        if(myUid === targetProfileUid) {
            document.getElementById("modal-avatar-url-input").value = "";
            document.getElementById("modal-image-preview").src = img.src;
            modal.style.display = "flex";
        }
    };
    document.getElementById("btn-save-modal-avatar").onclick = async () => {
        const url = document.getElementById("modal-avatar-url-input").value.trim();
        if(!url) return;
        await updateDoc(doc(db, "users", myUid), { avatar: url });
        modal.style.display = "none";
        alert("تم تحديث صورة الحساب بنجاح!");
        renderProfileData();
    };
}
