/* ==========================================================================
   Friends Platform - Live Reels Engine (2026 Production)
   ========================================================================== */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc
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
let currentUserData = null;

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = "index.html";
            return;
        }
        myUid = user.uid;
        await fetchUserInfo();
        listenToLiveReels();
        setupReelSubmission();
    });
});

async function fetchUserInfo() {
    const snap = await getDoc(doc(db, "users", myUid));
    if (snap.exists()) {
        currentUserData = snap.data();
    }
}

/* ================= نشر ريلز جديد وحفظه في الفايربيز ================= */
function setupReelSubmission() {
    const btn = document.getElementById("btn-publish-reel");
    const urlInp = document.getElementById("reel-video-url");
    const captionInp = document.getElementById("reel-caption-text");

    if (!btn) return;

    btn.onclick = async () => {
        const videoUrl = urlInp.value.trim();
        const caption = captionInp.value.trim();

        if (!videoUrl) {
            alert("من فضلك ضع رابط فيديو MP4 صحيح أولاً");
            return;
        }

        btn.innerText = "جاري رفع ونشر المقطع...";
        try {
            await addDoc(collection(db, "reels"), {
                videoUrl: videoUrl,
                caption: caption || "مقطع ريلز جديد بدون وصف 🎬",
                authorId: myUid,
                authorName: currentUserData ? currentUserData.name : "عضو موثق",
                createdAt: serverTimestamp()
            });

            urlInp.value = "";
            captionInp.value = "";
            alert("تم نشر مقطع الريلز الخاص بك بنجاح لايف! 🎬🚀");
        } catch (e) {
            alert("حدث خطأ أثناء نشر الريلز.");
        } finally {
            btn.innerText = "نشر المقطع لايف 🎬";
        }
    };
}

/* ================= التدفق الحي للريلز وسحب الفيديوهات تلقائياً ================= */
function listenToLiveReels() {
    const container = document.getElementById("reels-live-stream");
    const q = query(collection(db, "reels"), orderBy("createdAt", "desc"));

    onSnapshot(q, (snapshot) => {
        const reels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        if (reels.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #666; padding: 20px;">لا توجد مقاطع ريلز معروضة حالياً، كن أول من ينشر المقطع! 🎬</p>`;
            return;
        }

        container.innerHTML = reels.map(reel => `
            <div class="single-reel-card">
                <div class="reel-video-wrapper">
                    <!-- تشغيل الفيديو تلقائياً مع كتم الصوت افتراضياً متوافق مع تجربة المستخدم -->
                    <video src="${reel.videoUrl}" controls loop playsinline></video>
                </div>
                <div class="reel-meta-overlay">
                    <div class="reel-author" onclick="window.location.href='profile.html?id=${reel.authorId}'" style="cursor:pointer;">
                        <img src="https://www.gravatar.com/avatar/${reel.authorId}?d=mp">
                        <h4>${reel.authorName}</h4>
                    </div>
                    <p class="reel-caption">${reel.caption}</p>
                </div>
            </div>
        `).join("");
    });
}
