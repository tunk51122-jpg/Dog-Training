# PawMaster Pro — GitHub Pages ပြင်ဆင်မှု

ဒီ ZIP ကို အသုံးပြုရန်:

1. ZIP ကို Extract လုပ်ပါ။
2. `pawmaster-vite-ts` folder အတွင်းရှိ ဖိုင်များနှင့် `.github` folder အားလုံးကို `Dog-Training` repository ၏ root ထဲသို့ ထည့်ပါ။
3. GitHub → Settings → Pages → Build and deployment → Source တွင် `GitHub Actions` ကို ရွေးပါ။
4. `Actions` tab တွင် `Build and deploy PawMaster Pro to GitHub Pages` workflow ကို စောင့်ကြည့်ပါ။
5. Build နှင့် Deploy နှစ်ခုစလုံး အစိမ်းရောင် Success ဖြစ်မှ `https://tunk51122-jpg.github.io/Dog-Training/` ကို ဖွင့်ပါ။

## ပြင်ဆင်ထားသည့် အရေးကြီးအချက်

`index.html` ၏ Vite entry script ကို `/src/main.tsx` အဖြစ်ပြင်ထားသည်။ `%BASE_URL%src/main.tsx` ကို သုံးခဲ့သည့်အခါ Vite က source entry ကို `/Dog-Training/src/main.tsx` ဟု resolve လုပ်ရန်ကြိုးစားပြီး Rollup Build Error ဖြစ်ခဲ့သည်။ Favicon, Apple touch icon နှင့် manifest တို့တွင် `%BASE_URL%` ကို ဆက်လက်အသုံးပြုထားသည်။

အခြား App feature များကို မရည်ရွယ်ဘဲ မဖယ်ရှားပါ။ ZIP မှ project ဖိုင်များကို repository root သို့ update လုပ်သည့်အခါ အဟောင်းနှင့်အသစ် နှစ်စုံမဖြစ်စေရန် overwrite လုပ်ပါ။
