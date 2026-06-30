/* ==========================================================================
   Friends Platform - Global Authentication Engine (2026 Live Production)
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

/* ================= FIREBASE CRITICAL CONFIG ================= */
const firebaseConfig = {
  apiKey: "AIzaSyA5SS93zdj5N8oBMmjPgWvfSohdSBIRQ8c",
  authDomain: "friends7777.firebaseapp.com",
  projectId: "friends7777",
  storageBucket: "friends7777.firebasestorage.app",
  messagingSenderId: "276910802465",
  appId: "1:276910802465:web:f4c3c2df36295a71960560"
};

// تهيئة خدمات جوجل لايف
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const DEFAULT_AVATAR = "https://www.gravatar.com/avatar/?d=mp";

/* ================= نظام التنبيهات الموحد (Toast Window) ================= */
function triggerToast(message, icon = "✨") {
  const toast = document.getElementById("app-toast");
  if (!toast) return;
  
  const textContainer = toast.querySelector(".toast-message-text") || toast.querySelector(".class-toast-msg");
  const iconContainer = toast.querySelector(".toast-icon");
  
  if (textContainer) textContainer.innerText = message;
  if (iconContainer) iconContainer.innerText = icon;
  
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 4500);
}

/* ================= معالجة الأخطاء باللغة العربية الفصحى ================= */
function translateFirebaseError(errorMessage) {
    if (errorMessage.includes("auth/invalid-email")) return "صيغة البريد الإلكتروني المكتوب غير صحيحة.";
    if (errorMessage.includes("auth/weak-password")) return "كلمة المرور ضعيفة جداً، يجب أن لا تقل عن 6 أحرف أو أرقام.";
    if (errorMessage.includes("auth/email-already-in-use")) return "هذا البريد الإلكتروني مسجل بالفعل في المنصة.";
    if (errorMessage.includes("auth/wrong-password") || errorMessage.includes("auth/user-not-found") || errorMessage.includes("auth/invalid-credential")) {
        return "خطأ في البريد الإلكتروني أو كلمة المرور، يرجى التأكد والمحاولة مجدداً.";
    }
    return "فشلت العملية: " + errorMessage;
}

/* ================= تشغيل المحرك والتحكم بالصفحات لايف ================= */
document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-core-form");
    const registerForm = document.getElementById("register-core-form");
    const submitBtn = document.getElementById("auth-submit-btn");

    // [1] شاشة تسجيل الدخول المستقلة
    if (loginForm && submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const email = document.getElementById("auth-email").value.trim();
            const password = document.getElementById("auth-password").value.trim();

            if (!email || !password) {
                triggerToast("يرجى تعبئة كافة الحقول المطلوبة.", "⚠️");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = "جاري الدخول للمنصة...";

            try {
                await signInWithEmailAndPassword(auth, email, password);
                triggerToast("مرحباً بك مجدداً في Friends لايف! 🔥", "👋");
                setTimeout(() => window.location.href = "home.html", 1000);
            } catch (error) {
                console.error(error);
                triggerToast(translateFirebaseError(error.message), "❌");
                submitBtn.disabled = false;
                submitBtn.innerText = "دخول للمنصة لايف";
            }
        });
    }

    // [2] شاشة إنشاء الحساب الجديد المستقلة بجدارة
    if (registerForm && submitBtn) {
        submitBtn.addEventListener("click", async () => {
            const name = document.getElementById("auth-name").value.trim();
            const email = document.getElementById("auth-email").value.trim();
            const password = document.getElementById("auth-password").value.trim();

            if (!name || !email || !password) {
                triggerToast("يرجى إدخال كافة البيانات لتأسيس الحساب.", "⚠️");
                return;
            }

            if (password.length < 6) {
                triggerToast("يجب أن تتكون كلمة المرور من 6 خانات على الأقل.", "⚠️");
                return;
            }

            submitBtn.disabled = true;
            submitBtn.innerText = "جاري إنشاء الحساب الموثق...";

            try {
                // إنشاء الحساب في نظام الموثوقية بجوجل
                const credential = await createUserWithEmailAndPassword(auth, email, password);
                
                // تحديث الاسم الظاهري في ملف الـ SDK الأساسي
                await updateProfile(credential.user.uid, { displayName: name });

                // بناء ملف المستخدم الشامل للميزات المستقبلية (متجر، توثيق جدارة، حماية)
                const userProfileData = {
                    uid: credential.user.uid,
                    name: name,
                    email: email,
                    avatar: DEFAULT_AVATAR,
                    bio: "عضو مؤسس في مجتمع Friends النظيف الحين! ✨",
                    isVerified: true,        // ميزة التوثيق المجاني القائم على الجدارة مفعل تلقائياً لك
                    hasMarketplace: true,    // تفعيل ميزة المتجر المصغر مسبقاً بعمولة 0%
                    marketplaceServices: [],  // مصفوفة الخدمات والمنتجات الرقمية
                    followers: [],
                    following: [],
                    createdAt: new Date().toISOString()
                };

                // تخزين الملف في قاعدة البيانات الكبيرة Firestore Database
                await setDoc(doc(db, "users", credential.user.uid), userProfileData);

                triggerToast("تم إنشاء حسابك الموثق بنجاح! 🎉", "✅");
                setTimeout(() => window.location.href = "home.html", 1200);

            } catch (error) {
                console.error(error);
                triggerToast(translateFirebaseError(error.message), "❌");
                submitBtn.disabled = false;
                submitBtn.innerText = "تسجيل الحساب بنجاح";
            }
        });
    }

    /* ================= مراقب الحالة الذكي (State Observer) ================= */
    onAuthStateChanged(auth, (user) => {
        const currentPath = window.location.pathname;
        
        // إذا كان اليوزر مسجل دخوله بالفعل وجاء لصفحة الدخول أو التسجيل، يتم نقله للتايملاين فوراً
        if (user) {
            if (currentPath.includes("login.html") || currentPath.includes("register.html")) {
                window.location.href = "home.html";
            }
        }
    });
});
