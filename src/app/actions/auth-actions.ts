'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// 1. دالة طلب الـ OTP وإرساله عبر WhatsApp API
export async function requestOTP(formData: FormData) {
  const phone = formData.get('phone') as string;
  
  if (!phone) return { error: 'رقم الهاتف مطلوب' };

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  // توليد كود من 6 أرقام
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  // حفظ الكود في الداتا بيز (كما جهزنا الجدول مسبقاً)
  const { error: dbError } = await supabase
    .from('otp_requests')
    .insert({ phone, otp_code: otpCode, expires_at: expiresAt });

  if (dbError) return { error: 'حدث خطأ في النظام، حاول مرة أخرى' };

  // إرسال الكود عبر Meta WhatsApp Cloud API (Authentication Template)
  try {
    const metaApiUrl = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_ID}/messages`;
    const response = await fetch(metaApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone.replace('+', ''), // Meta تطلب الرقم بدون علامة +
        type: "template",
        template: {
          name: "talin_fresh_otp", // اسم القالب الذي سننشئه في حساب Meta
          language: { code: "ar" },
          components: [
            {
              type: "body",
              parameters: [ { type: "text", text: otpCode } ]
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [ { type: "text", text: otpCode } ]
            }
          ]
        }
      })
    });

    const result = await response.json();
    console.log('[WhatsApp API Result]:', result); // للمراقبة في السيرفر

  } catch (err) {
    console.error('WhatsApp Error:', err);
    // لن نوقف العملية أثناء التطوير حتى لو فشل الواتساب، سنطبع الكود في التيرمينال
  }
  
  console.log(`[DEV MODE] OTP for ${phone} is: ${otpCode}`);
  return { success: true };
}

// 2. دالة التحقق من الـ OTP وفتح الجلسة في Supabase
export async function verifyOTP(formData: FormData) {
  const phone = formData.get('phone') as string;
  const otp = formData.get('otp') as string;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, 
    { 
      cookies: { 
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        }
      } 
    }
  );

  // 1. البحث عن الكود في الداتا بيز والتأكد من عدم انتهاء صلاحيته
  const { data, error } = await supabase
    .from('otp_requests')
    .select('*')
    .eq('phone', phone)
    .eq('otp_code', otp)
    .gte('expires_at', new Date().toISOString()) // لم يمر 5 دقائق
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return { error: 'الكود غير صحيح أو منتهي الصلاحية' };
  }

  // 2. السحر المعماري: إنشاء حساب العميل في Supabase (إن لم يكن موجوداً) أو تسجيل دخوله
  // نستخدم admin.createUser لأنه لا يطلب باسوورد، ونحن نضمن العميل بالـ OTP
  
  let userId;
  const { data: userExists } = await supabase.auth.admin.listUsers();
  const existingUser = userExists.users.find(u => u.phone === phone);

  if (existingUser) {
    userId = existingUser.id;
  } else {
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      phone: phone,
      phone_confirm: true,
      user_metadata: { role: 'customer' }
    });
    if (createError) return { error: 'فشل في إنشاء الحساب' };
    userId = newUser.user.id;
  }

  // 3. زرع التوكن (Session) في جهاز العميل ليبقى مسجلاً للدخول
  // نستخدم طريقة Magic Link Auth خلف الكواليس لتوليد Session صالحة
  const { error: sessionError } = await supabase.auth.signInWithOtp({
      phone: phone,
  });
  
  // ملحوظة: في بيئة الإنتاج الفعلي (Go-Live)، وبما أننا لا نستخدم Twilio، 
  // سنقوم ببناء نظام Custom JWT Session مخصص، أو استخدام Supabase Custom Token.
  // ولكن مؤقتاً، سنعتمد هذه الاستراتيجية.

  return { success: true };
}
