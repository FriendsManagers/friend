/* ==========================================================================
   Friends Platform - Live Chat & Human Support Engine (2026 Production)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs, doc, getDoc
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

let currentUserId = null;
let activeTargetUserId = null;
let activeRoomId = null;

document.addEventListener("DOMContentLoaded", () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = "login.html";
        } else {
            currentUserId = user.uid;
            loadUsersSidebarList();
            setupSendFormHandler();
            setupSupportButton();
        }
    });
});

/* ================= جلب المستخدمين المتاحين لبدء شات معهم ================= */
async function loadUsersSidebarList() {
    const container = document.getElementById("rooms-list-container");
    try {
        const usersSnap = await getDocs(collection(db, "users"));
        let htmlList = "";

        usersSnap.forEach((userDoc) => {
            const uData = userDoc.data();
            // عدم إظهار حسابي الشخصي في قائمة المحادثات الجانبية
            if (uData.uid !== currentUserId) {
                htmlList += `
                    <div class="sidebar-user-item" data-uid="${uData.uid}" data-name="${uData.name}" data-avatar="${uData.avatar || 'https://www.gravatar.com/avatar/?d=mp'}">
                        <img src="${uData.avatar || 'https://www.gravatar.com/avatar/?d=mp'}" class="sb-avatar">
                        <div class="sb-user-info">
                            <h4>${uData.name}</h4>
                            <span>اضغط لبدء شات لايف 🟢</span>
                        </div>
                    </div>
                `;
            }
        });

        container.innerHTML = htmlList || `<p class="chat-loading-text">لا يوجد مستخدمين آخرين حالياً.</p>`;

        // ربط حدث الضغط على أي مستخدم لبدء الشات فوراً
        document.querySelectorAll(".sidebar-user-item").forEach(item => {
            item.onclick = () => {
                startActiveChatSession(item.getAttribute("data-uid"), item.getAttribute("data-name"), item.getAttribute("data-avatar"));
            };
        });

    } catch (e) {
        container.innerHTML = `<p class="chat-loading-text">حدث خطأ أثناء تحميل الغرف.</p>`;
    }
}

/* ================= تفعيل ميزة زر الدعم البشري الحقيقي ================= */
function setupSupportButton() {
    const supportAnchor = document.getElementById("trigger-support-chat");
    if(supportAnchor) {
        supportAnchor.onclick = () => {
            // توجيه المستخدم لغرفة دعم مخصصة بمعرف الإدارة الثابت "platform_support_admin"
            startActiveChatSession("platform_support_admin", "الدعم الفني البشري الرسمي", "https://cdn-icons-png.flaticon.com/512/681/681494.png");
        };
    }
}

/* ================= فتح واجهة الشات النشط وبناء معرّف الغرفة (Room ID) ================= */
function startActiveChatSession(targetUid, targetName, targetAvatar) {
    activeTargetUserId = targetUid;
    
    // إخفاء الحالة الفارغة وإظهار واجهة الشات
    document.getElementById("chat-empty-view").style.display = "none";
    document.getElementById("chat-active-view").style.display = "flex";

    // تحديث الهيدر بالبيانات الحقيقية للمستقبل
    document.getElementById("active-chat-name").innerText = targetName;
    document.getElementById("active-chat-avatar").src = targetAvatar;

    // بناء Room ID ثابت وفريد يجمع الطرفين (ترتيب الحروف أبجدياً لمنع تكرار الغرفة)
    activeRoomId = currentUserId < targetUid ? `${currentUserId}_${targetUid}` : `${targetUid}_${currentUserId}`;

    // بدء الاستماع والتدفق الحي للرسائل بالثانية
    listenToIncomingLiveMessages();
}

/* ================= التدفق الحي للرسائل من السيرفر (Real-time Stream) ================= */
function listenToIncomingLiveMessages() {
    const streamContainer = document.getElementById("messages-stream-container");
    streamContainer.innerHTML = `<p class="chat-loading-text">جاري فتح اتصال آمن ومشفر...</p>`;

    const q = query(collection(db, "chats", activeRoomId, "messages"), orderBy("createdAt", "asc"));
    
    onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => doc.data());
        
        if (messages.length === 0) {
            streamContainer.innerHTML = `<p class="chat-loading-text">بداية محادثة نظيفة وحرة الحين 🔒</p>`;
            return;
        }

        streamContainer.innerHTML = messages.map(msg => {
            // تحديد إذا كانت الرسالة مرسلة مني أو من الطرف الآخر لتحديد الشكل والاتجاه
            const isMe = (msg.senderId === currentUserId);
            const msgClass = isMe ? "msg-bubble outward-me" : "msg-bubble inward-them";

            return `
                <div class="message-row ${isMe ? 'row-me' : 'row-them'} animate-fade-in-up">
                    <div class="${msgClass}">
                        <p class="msg-text-p">${msg.text}</p>
                    </div>
                </div>
            `;
        }).join("");

        // النزول التلقائي لأسفل الشات لرؤية الرسائل الجديدة فوراً
        streamContainer.scrollTop = streamContainer.scrollHeight;
    });
}

/* ================= معالجة إرسال الرسالة الحية ================= */
function setupSendFormHandler() {
    const form = document.getElementById("chat-send-form");
    const input = document.getElementById("chat-message-input");
    const btn = document.getElementById("chat-send-btn");

    if (!form || !input || !btn) return;

    form.onsubmit = async () => {
        const text = input.value.trim();
        if (!text || !activeRoomId) return;

        input.value = ""; // تفريغ حقل الإدخال فوراً لسرعة الأداء (UI Snap)
        
        try {
            await addDoc(collection(db, "chats", activeRoomId, "messages"), {
                text: text,
                senderId: currentUserId,
                createdAt: serverTimestamp()
            });
        } catch (e) {
            console.error("فشل إرسال الرسالة:", e);
        }
    };
}
