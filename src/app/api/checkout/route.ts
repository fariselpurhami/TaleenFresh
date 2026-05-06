// src/app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 🚨 شلنا الـ edge runtime عشان نضمن إن الـ Node.js يقرا المفاتيح السرية صح 100%

export async function POST(req: Request) {
  try {
    console.log("🛒 [Checkout API] استقبال طلب جديد من الواجهة...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("❌ [Checkout API] مصيبة: المفاتيح مش مقروءة! تأكد من ملف .env");
      return NextResponse.json({ error: 'System configuration error' }, { status: 500 });
    }

    // تهيئة العميل الخارق جوه الدالة عشان نضمن قراءة الـ ENV
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const body = await req.json();
    console.log("📦 [Checkout API] البيانات اللي وصلت:", body);

    const { customer_name, customer_phone, customer_address, items, total_price, status } = body;

    // --- Validation ---
    if (!customer_name || !customer_phone || !customer_address) {
      console.error("❌ [Checkout API] نقص في بيانات العميل");
      return NextResponse.json({ error: 'Missing customer details' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      console.error("❌ [Checkout API] السلة فارغة");
      return NextResponse.json({ error: 'Cart cannot be empty' }, { status: 400 });
    }

    const orderData = {
      customer_name: customer_name.trim(),
      customer_phone: customer_phone.trim(),
      customer_address: customer_address.trim(),
      items: items.map(item => ({
        name: String(item.name).trim(),
        qty: Number(item.qty),
        price: Number(item.price)
      })),
      total_price: Number(total_price),
      status: status || 'pending'
    };

    console.log("🚀 [Checkout API] جاري رمي الطلب في قاعدة البيانات:", orderData);

    // إضافة .select() عشان نتأكد إن قاعدة البيانات ردت بالطلب الجديد
    const { data, error: dbError } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select(); 

    if (dbError) {
      // 🚨 هنا هنكشف المجرم الحقيقي!
      console.error("❌ [Checkout API] قاعدة البيانات رفضت الطلب والسبب:", dbError);
      return NextResponse.json(
        { error: 'Database transaction failed', details: dbError },
        { status: 502 }
      );
    }

    console.log("✅ [Checkout API] الله ينور! تم تسجيل الطلب بنجاح:", data);
    return NextResponse.json(
      { success: true, message: 'Order created successfully', data },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("❌ [Checkout API] خطأ عام أدى لانهيار العملية:", error);
    return NextResponse.json(
      { error: 'Internal server error processing checkout', message: error.message },
      { status: 500 }
    );
  }
}
