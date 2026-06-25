/* ==========================================================================
   Friends Core Application Engine - 2026 Modern JS
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

// قاعدة بيانات وهمية مؤقتة (Mock Data) لتشغيل الموقع فوراً وإبهار المستخدمين
const mockStories = [
    { id: 1, username: 'أنت', avatar: 'https://img.icons8.com/illustrations/style=flat/color=blue/card-user.png' },
    { id: 2, username: 'م. أحمد', avatar: 'https://img.icons8.com/illustrations/style=flat/color=blue/businessman.png' },
    { id: 3, username: 'سارة كريم', avatar: 'https://img.icons8.com/illustrations/style=flat/color=blue/businesswoman.png' },
    { id: 4, username: 'عمر المختار', avatar: 'https://img.icons8.com/illustrations/style=flat/color=blue/worker.png' }
];

const mockNotes = [
    { id: 1, username: 'م. أحمد', text: 'متاح للاستشارات البرمجية 💻', avatar: 'https://img.icons8.com/illustrations/style=flat/color=blue/businessman.png' },
    { id: 2, username: 'سارة كريم', text: 'تصاميم UI جديدة قريباً! ✨', avatar: 'https://img.icons8.com/illustrations/style=flat/color=blue/businesswoman.png' }
];

let mockPosts = [
    {
        id: 101,
        author: 'م. أحمد',
        avatar: 'https://img.icons8.com/illustrations/style=flat/color=blue/businessman.png',
        time: 'منذ ساعتين',
        text: 'الحمد لله، تم إطلاق الواجهة الجديدة لنظام إدارة المشاريع الذكي! التصميم يعتمد بالكامل على تجربة مستخدم سريعة ودعم تلقائي للوضع الداكن. رأيكم يهمني يا بشمهندسين 🚀',
        media: 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=600&q=80',
        mediaType: 'image',
        likes: 12,
        liked: false,
        comments: [
            { author: 'سارة كريم', text: 'شغل عالي جداً وتوزيع الألوان مريح للعين.' },
            { author: 'عمر المختار', text: 'عاش يا هندسة بالتوفيق!' }
        ]
    }
];

// الدالة الرئيسية لتشغيل التطبيق
function initApp() {
    renderStories();
    renderNotes();
    renderFeed();
    setupEventListeners();
    showToast('✨ أهلاً بك في منصة Friends المحدثة', 'success');
}

// 1. رسم الستوريز في الشريط العلوي
function renderStories() {
    const wrapper = document.getElementById('stories-wrapper');
    if (!wrapper) return;
    
    wrapper.innerHTML = mockStories.map(story => `
        <div class="story-item">
            <div class="story-avatar-wrapper">
                <img src="${story.avatar}" alt="${story.username}">
            </div>
            <p class="story-username">${story.username}</p>
        </div>
    `).join('');
}

// 2. رسم الملاحظات السريعة
function renderNotes() {
    const shelf = document.getElementById('notes-shelf');
    if (!shelf) return;
    
    shelf.innerHTML = mockNotes.map(note => `
        <div class="note-bubble-item">
            <div class="note-text-cloud">${note.text}</div>
            <img class="note-avatar" src="${note.avatar}" alt="${note.username}">
        </div>
    `).join('');
}

// 3. رسم تايملاين البوستات
function renderFeed() {
    const feedContainer = document.getElementById('app-timeline-feed');
    if (!feedContainer) return;
    
    if (mockPosts.length === 0) {
        feedContainer.innerHTML = `<p style="text-align:center; color:var(--text-secondary); padding:20px;">لا يوجد منشورات حالياً، كن أول من ينشر!</p>`;
        return;
    }
    
    feedContainer.innerHTML = mockPosts.map(post => {
        let mediaHtml = '';
        if (post.media) {
            if (post.mediaType === 'video') {
                mediaHtml = `<div class="post-media-attachment"><video src="${post.media}" controls></video></div>`;
            } else {
                mediaHtml = `<div class="post-media-attachment"><img src="${post.media}" class="lightbox-trigger" alt="مرفق"></div>`;
            }
        }
        
        return `
            <div class="feed-card" data-id="${post.id}">
                <div class="card-header">
                    <div class="card-user-info">
                        <img class="user-avatar" src="${post.avatar}" alt="${post.author}">
                        <div class="post-meta">
                            <h4>${post.author}</h4>
                            <span>${post.time}</span>
                        </div>
                    </div>
                </div>
                <p class="post-body-text">${post.text}</p>
                ${mediaHtml}
                <div class="card-actions-bar">
                    <button class="action-btn like-toggle-btn ${post.liked ? 'liked' : ''}">
                        ❤️ <span>${post.likes}</span> إعجاب
                    </button>
                    <button class="action-btn open-comments-btn">
                        💬 <span>${post.comments.length}</span> تعليق
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 4. إعداد وتفعيل مراقبي الأحداث (Event Listeners)
let currentSelectedFile = null;
let activePostIdForComments = null;

function setupEventListeners() {
    // معالجة رفع ومعاينة الميديا
    const fileInput = document.getElementById('file-upload-input');
    const previewZone = document.getElementById('file-preview-zone');
    const previewMount = document.getElementById('preview-render-mount');
    const cancelPreviewBtn = document.getElementById('cancel-preview-btn');
    
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                currentSelectedFile = file;
                const fileUrl = URL.createObjectURL(file);
                previewZone.style.display = 'block';
                
                if (file.type.startsWith('video/')) {
                    previewMount.innerHTML = `<video src="${fileUrl}" controls style="width:100%;"></video>`;
                } else {
                    previewMount.innerHTML = `<img src="${fileUrl}" style="width:100%;" />`;
                }
            }
        });
    }
    
    if (cancelPreviewBtn) {
        cancelPreviewBtn.addEventListener('click', () => {
            currentSelectedFile = null;
            previewZone.style.display = 'none';
            previewMount.innerHTML = '';
            if (fileInput) fileInput.value = '';
        });
    }

    // نشر بوست جديد
    const publishBtn = document.getElementById('publish-post-btn');
    const postTextarea = document.getElementById('post-textarea');
    
    if (publishBtn) {
        publishBtn.addEventListener('click', () => {
            const text = postTextarea.value.trim();
            if (!text && !currentSelectedFile) {
                showToast('⚠️ يرجى كتابة نص أو إرفاق ميديا أولاً', 'error');
                return;
            }
            
            // بناء بوست جديد وإضافته فوراً لأعلى التايملاين
            const newPost = {
                id: Date.now(),
                author: 'أنت',
                avatar: 'https://img.icons8.com/illustrations/style=flat/color=blue/card-user.png',
                time: 'الآن',
                text: text,
                media: currentSelectedFile ? URL.createObjectURL(currentSelectedFile) : null,
                mediaType: currentSelectedFile && currentSelectedFile.type.startsWith('video/') ? 'video' : 'image',
                likes: 0,
                liked: false,
                comments: []
            };
            
            mockPosts.unshift(newPost);
            renderFeed();
            
            // تصفية الحقول بعد النشر
            postTextarea.value = '';
            if (cancelPreviewBtn) cancelPreviewBtn.click();
            showToast('✅ تم نشر منشورك بنجاح', 'success');
        });
    }

    // كتابة نوتة سريعة جديدة
    const submitNoteBtn = document.getElementById('submit-note-btn');
    const noteInput = document.getElementById('note-input');
    if (submitNoteBtn && noteInput) {
        submitNoteBtn.addEventListener('click', () => {
            const text = noteInput.value.trim();
            if (!text) return;
            
            mockNotes.unshift({
                id: Date.now(),
                username: 'أنت',
                text: text,
                avatar: 'https://img.icons8.com/illustrations/style=flat/color=blue/card-user.png'
            });
            renderNotes();
            noteInput.value = '';
            showToast('💡 تم تحديث حالتك السريعة', 'success');
        });
    }

    // التحكم في التفاعل جوه التايملاين (الإعجابات، صفيحة التعليقات، والـ Lightbox)
    const feedContainer = document.getElementById('app-timeline-feed');
    if (feedContainer) {
        feedContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.feed-card');
            if (!card) return;
            const postId = parseInt(card.dataset.id);
            const post = mockPosts.find(p => p.id === postId);
            
            // زر الإعجاب
            if (e.target.closest('.like-toggle-btn')) {
                post.liked = !post.liked;
                post.likes += post.liked ? 1 : -1;
                renderFeed();
            }
            
            // فتح صفيحة التعليقات السفلية (Bottom Sheet)
            if (e.target.closest('.open-comments-btn')) {
                openCommentsSheet(post);
            }
            
            // تفعيل نظام الـ Lightbox عند الضغط على الصورة
            if (e.target.classList.contains('lightbox-trigger')) {
                const lightbox = document.getElementById('media-lightbox');
                const lightboxImg = document.getElementById('lightbox-img');
                if (lightbox && lightboxImg) {
                    lightboxImg.src = e.target.src;
                    lightbox.style.display = 'flex';
                }
            }
        });
    }

    // إغلاق الـ Lightbox
    const closeLightbox = document.querySelector('.close-lightbox');
    if (closeLightbox) {
        closeLightbox.addEventListener('click', () => {
            document.getElementById('media-lightbox').style.display = 'none';
        });
    }

    // إغلاق صفيحة التعليقات
    const closeSheetBtn = document.getElementById('close-sheet-btn');
    const backdrop = document.getElementById('comments-backdrop');
    if (closeSheetBtn) closeSheetBtn.addEventListener('click', closeCommentsSheet);
    if (backdrop) backdrop.addEventListener('click', closeCommentsSheet);

    // إرسال تعليق جديد جوه الصفيحة
    const sendCommentBtn = document.getElementById('send-comment-btn');
    const newCommentInput = document.getElementById('new-comment-input');
    if (sendCommentBtn && newCommentInput) {
        sendCommentBtn.addEventListener('click', () => {
            const commentText = newCommentInput.value.trim();
            if (!commentText || !activePostIdForComments) return;
            
            const post = mockPosts.find(p => p.id === activePostIdForComments);
            post.comments.push({
                author: 'أنت',
                text: commentText
            });
            
            newCommentInput.value = '';
            openCommentsSheet(post); // إعادة رسم التعليقات لتظهر الجديدة
            renderFeed(); // تحديث عداد التعليقات في التايملاين الأساسي
        });
    }

    // زر تغيير المظهر (Theme Toggle) يدويًا للتجربة
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.style.getPropertyValue('--bg-main');
            if (currentTheme === '#0b0c10') {
                document.documentElement.style.setProperty('--bg-main', '#f0f2f5');
                document.documentElement.style.setProperty('--bg-surface', '#ffffff');
                document.documentElement.style.setProperty('--text-primary', '#1c1e21');
            } else {
                document.documentElement.style.setProperty('--bg-main', '#0b0c10');
                document.documentElement.style.setProperty('--bg-surface', '#1f2833');
                document.documentElement.style.setProperty('--text-primary', '#c5c6c7');
            }
        });
    }
}

// وظائف صفيحة التعليقات السفلية
function openCommentsSheet(post) {
    activePostIdForComments = post.id;
    document.getElementById('comments-title').innerText = `التعليقات (${post.comments.length})`;
    
    const container = document.getElementById('comments-list-container');
    if (post.comments.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-secondary); padding:20px;">لا توجد تعليقات بعد، كن أول من يعلق!</p>`;
    } else {
        container.innerHTML = post.comments.map(c => `
            <div class="comment-item">
                <div class="comment-bubble">
                    <strong style="display:block; font-size:12px; margin-bottom:2px; color:var(--accent-color);">${c.author}</strong>
                    <span style="font-size:14px;">${c.text}</span>
                </div>
            </div>
        `).join('');
    }
    
    document.getElementById('comments-backdrop').classList.add('open');
    document.getElementById('comments-sheet').classList.add('open');
}

function closeCommentsSheet() {
    document.getElementById('comments-backdrop').classList.remove('open');
    document.getElementById('comments-sheet').classList.remove('open');
    activePostIdForComments = null;
}

// نظام الـ Toast الإشعاري الذكي
function showToast(message, type = 'success') {
    const toast = document.getElementById('system-toast');
    const textSpan = document.getElementById('toast-text');
    const iconSpan = document.getElementById('toast-icon');
    
    if (!toast || !textSpan) return;
    
    textSpan.innerText = message;
    iconSpan.innerText = type === 'success' ? '✨' : '⚠️';
    
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3500);
}
