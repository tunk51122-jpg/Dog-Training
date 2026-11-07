import { z } from 'zod';

export const dogProfileSchema = z.object({
  name: z.string().min(2, { message: 'ခွေးလေးအမည် အနည်းဆုံး ၂ လုံး ထည့်သွင်းပေးပါ' }).max(40),
  breed: z.string().min(2, { message: 'မျိုးရိုးအမည် ထည့်သွင်းပေးပါ' }).max(60),
  ageGroup: z.enum(['၂ လ - ၆ လ (Puppy)', '၆ လ - ၁ နှစ် (Junior)', '၁ နှစ်အထက် (Adult)']),
  dailyGoalMinutes: z.coerce.number().int().min(3).max(60),
});

export type DogProfileSchemaType = z.infer<typeof dogProfileSchema>;

export const sessionLogSchema = z.object({
  skillId: z.string().min(1, { message: 'သင်ခန်းစာ ရွေးချယ်ပေးပါ' }),
  repsCompleted: z.coerce.number().int().min(1).max(100),
  note: z.string().min(4, { message: 'မှတ်ချက် အနည်းဆုံး ၄ လုံး ရေးသားပေးပါ' }).max(200),
});

export type SessionLogSchemaType = z.infer<typeof sessionLogSchema>;
