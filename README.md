# ختمة حنين 🤍 — صدقة جارية

صفحة HTML + CSS + JS فقط — ختمة قرآن أسبوعية + أدعية + تقارير.

## التشغيل محليا
افتح `index.html` في المتصفح مباشرة (دبل كليك).

## المميزات
- الرئيسية: أدعية لحنين + زر نسخ + إحصائيات الأسبوع
- القراءة: يطلب الاسم، يعرض 30 جزء بالسور، زر اختيار، منع التكرار في نفس الأسبوع، زر تمت القراءة ✅ وإلغاء
- التقارير: تقرير كل أسبوع (تم / محجوز ولم يتم / ناقص) + جدول لكل شخص + حفظ كل الأسابيع
- زر بدء أسبوع جديد + تحميل التقرير TXT

## الحل المجاني لكل الأجهزة (مزامنة لحظية) — خطوتان فقط

الموقع بيشتغل بوضعين:
- لو `firebase-config.js` مش متظبط: الحفظ على نفس الجهاز فقط.
- لو ظبطته (5 دقايق مرة واحدة): الحجز يظهر على كل الموبايلات لحظيا 🟢 ومجاني تماما.

### 1) اعمل قاعدة بيانات مجانية (Firebase Spark - بدون فيزا)
1. ادخل https://console.firebase.google.com واعمل مشروع جديد `hanen-khatma`
2. من القايمة: Build → Firestore Database → Create database → اختار أقرب منطقة → Start in **test mode**
3. من Project Settings (علامة الترس) → General → Your apps → Web `</>` → سجل app باسم hanen → انسخ الـ `firebaseConfig`
4. افتح ملف `firebase-config.js` عندك والصق القيم وخلي `CONFIGURED: true`
5. في Firestore → Rules الصق ده واعمل Publish:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /hanen_weeks/{doc} { allow read, write: if true; }
    match /hanen_bookings/{doc} { allow read, write: if true; }
  }
}
```

### 2) الرفع على استضافة دائمة مجانية (GitHub Pages)
1. اعمل حساب على github.com
2. اعمل ريبو جديد باسم مثلا `hanen-khatma` وارفع الملفات دي:
   - index.html
   - styles.css
   - quran-data.js
   - app.js
   - firebase-config.js
3. من صفحة الريبو: Settings → Pages → Deploy from branch → اختار `main` و `/ (root)` → Save
4. بعد دقيقة هيطلعلك لينك دائم شكله:
   `https://USERNAME.github.io/hanen-khatma/`
   ابعته للعيلة كلها.

### الرفع من الكمبيوتر (اختياري)
```bash
cd "D:\my laravel projects\hanen"
git init
git add .
git commit -m "ختمة حنين"
git branch -M main
git remote add origin https://github.com/USERNAME/hanen-khatma.git
git push -u origin main
```

## ملاحظة عن التكلفة
- GitHub Pages: مجاني ودائم.
- Firebase Spark: مجاني (50 ألف قراءة و20 ألف كتابة يوميا — كفاية جدا لعيلة).
