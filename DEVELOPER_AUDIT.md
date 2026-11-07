# PawMaster Pro — Developer Audit & Change Log

## ပြင်ဆင်ပြီးသောအချက်များ

1. **GitHub Pages / Vite path**
   - `vite.config.ts` တွင် `VITE_BASE_PATH` ကို ထည့်သွင်းအသုံးပြုနိုင်အောင် ပြင်ဆင်ထားသည်။
   - `index.html` ရှိ script, favicon, apple-touch icon နှင့် manifest path များကို `%BASE_URL%` ဖြင့် ချိတ်ထားသည်။
   - Manifest ၏ `id`, `start_url`, `scope` နှင့် icon path များကို relative path သုံးထားသည်။
   - Service Worker ကို production တွင်သာ register လုပ်ပြီး GitHub project subpath အောက်တွင်ပါ scope မှန်ကန်စွာ register ဖြစ်အောင် ပြင်ထားသည်။

2. **GitHub Actions deployment**
   - `.github/workflows/deploy.yml` အသစ်ထည့်ထားသည်။
   - `main` သို့မဟုတ် `master` branch သို့ push လုပ်သောအခါ install → build → GitHub Pages deploy လုပ်မည်။
   - Project Pages URL (`https://<username>.github.io/<repository-name>/`) အတွက် base path ကို repository name မှ အလိုအလျောက် သတ်မှတ်ပေးသည်။

3. **PWA / Offline cache**
   - Service Worker ကို versioned cache, stale cache cleanup, navigation fallback နှင့် static asset caching ပါအောင် ပြန်ရေးထားသည်။
   - App shell နှင့် public assets များကို cache လုပ်ထားသည်။ ပထမဆုံး online ဖွင့်ပြီး cache တည်ဆောက်ပြီးမှ offline အသုံးပြုနိုင်သည်။

4. **Image / Asset optimization**
   - App component ထဲရှိ Base64 puppy image duplicate နှစ်ခုကို external JPEG asset တစ်ခုအဖြစ် ခွဲထုတ်ထားသည်။
   - Puppy image ကို 640 × 640 JPEG အဖြစ် optimize လုပ်ထားသည်။
   - PWA အတွက် 192px / 512px PNG icon နှင့် Apple touch icon ထည့်ထားသည်။

5. **Data persistence / validation**
   - Dog profile, lesson progress, clicker settings နှင့် routine checklist state များကို Zustand Persist ဖြင့် browser local storage ထဲ သိမ်းထားသည်။
   - Routine checklist ကို ရက်စွဲအလိုက်သာ ပြသ/ပြန်စတင်စေသည်။
   - Persisted profile နှင့် lesson progress ကို ပြန်ဖတ်သည့်အခါ type/range validation လုပ်ထားသည်။
   - Training history ကို `pawmaster-session-logs-v1` ဖြင့် local storage ထဲသိမ်းပြီး corrupted record များကို စစ်ထုတ်ထားသည်။
   - Daily goal, profile text, reps နှင့် note များအတွက် validation ကို တင်းကျပ်ထားသည်။

6. **PWA install behavior / UX**
   - Browser install prompt မရှိလျှင် manual install guide ကို ပြသမည်။
   - User က guide/banner ပိတ်လိုက်ခြင်းကို “install ပြီးပြီ” ဟု မှားယွင်းသတ်မှတ်ခြင်းကို ဖယ်ရှားထားသည်။
   - Browser `appinstalled` event သို့မဟုတ် standalone mode တွင်သာ installed status သတ်မှတ်သည်။

7. **Project maintenance**
   - `.gitignore`, Node.js 20+ engine requirement, `typecheck` script နှင့် Burmese README ထည့်ထားသည်။
   - UI ထဲက မသုံးသော RHF / React Query implementation များကို လက်ရှိ App က အသုံးပြုနေသကဲ့သို့ ရေးသားထားသောစာသားကို ပြင်ထားသည်။

## စမ်းသပ်မှုရလဒ်

- TypeScript/TSX syntax transpile check — **PASS (7 files)**
- Service Worker JavaScript syntax (`node --check`) — **PASS**
- Web App Manifest JSON — **PASS**
- Manifest icon file existence and dimensions — **PASS**
- Local source import path existence — **PASS**
- Inline Base64 image removal — **PASS**
- Full `npm run build` — **NOT RUN**: `node_modules` မရှိသေးပြီး npm registry ကို ချိတ်ဆက်၍ dependencies install လုပ်မရခဲ့ပါ။ Syntax check သည် full TypeScript type-check သို့မဟုတ် Vite production build အစားထိုးမဟုတ်ပါ။

## မပြီးသေးသော Product / Production လိုအပ်ချက်များ

- လက်ရှိ Data သည် browser/device တစ်ခု၏ Local Storage ထဲတွင်သာ ရှိသည်။ Cloud database, user login, multi-device sync မပါသေးပါ။
- Browser data clear လုပ်ခြင်း၊ device/browser ပြောင်းခြင်းကြောင့် local data ပျောက်နိုင်သည်။ အရေးကြီး data အတွက် backup/export/import feature ထပ်လိုအပ်သည်။
- Real device များတွင် Android Chrome / iOS Safari install, offline launch, sound playback နှင့် long-term storage ကို စမ်းသပ်ရန် လိုအပ်သည်။
- GitHub repository သို့ push ပြီးမှ GitHub Actions deployment ကို တစ်ကြိမ် အမှန်တကယ် run စစ်ဆေးရမည်။
- Production release မတိုင်မီ dependency install, full type-check, production build နှင့် browser QA ကို ပြီးစီးစေရမည်။

## GitHub တင်သွင်းရာတွင် သတိပြုရန်

ZIP ကို repository ထဲတွင် ZIP ဖိုင်တစ်ဖိုင်အဖြစ် ထည့်ရုံဖြင့် Website မ deploy ဖြစ်ပါ။ ZIP ကို Extract လုပ်ပြီး အတွင်းရှိ `pawmaster-vite-ts` folder ၏ **contents** (အထူးသဖြင့် `.github` folder အပါအဝင်) ကို GitHub repository root တွင် ထည့်ပြီး push လုပ်ပါ။ GitHub → Settings → Pages → Source ကို **GitHub Actions** ရွေးပါ။
