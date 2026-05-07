import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const paymobApiKey = process.env.PAYMOB_API_KEY
    const paymobIntegrationId = process.env.PAYMOB_INTEGRATION_ID
    const paymobIframeId = process.env.PAYMOB_IFRAME_ID

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase environment variables' },
        { status: 500 }
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })

    const body = await req.json()

    const {
      customer_name,
      customer_phone,
      customer_address,
      items,
      total_price,
      payment_method
    } = body

    if (!customer_name || !customer_phone || !customer_address) {
      return NextResponse.json(
        { error: 'Missing customer details' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Cart cannot be empty' },
        { status: 400 }
      )
    }

    const normalizedPaymentMethod = payment_method === 'card' ? 'card' : 'cod'

    const orderData = {
      customer_name: String(customer_name).trim(),
      customer_phone: String(customer_phone).trim(),
      customer_address: String(customer_address).trim(),
      items: items.map((item: any) => ({
        name: String(item.name).trim(),
        qty: Number(item.qty),
        price: Number(item.price)
      })),
      total_price: Number(total_price),
      status: 'pending',
      payment_method: normalizedPaymentMethod
    }

    const { data: insertedOrder, error: insertError } = await supabaseAdmin
      .from('orders')
      .insert([orderData])
      .select('id')
      .single()

    if (insertError || !insertedOrder) {
      return NextResponse.json(
        {
          error: 'Database transaction failed',
          code: insertError?.code,
          message: insertError?.message,
          details: insertError?.details,
          hint: insertError?.hint
        },
        { status: 500 }
      )
    }

    if (normalizedPaymentMethod === 'cod') {
      return NextResponse.json(
        {
          success: true,
          orderId: insertedOrder.id
        },
        { status: 201 }
      )
    }

    if (!paymobApiKey || !paymobIntegrationId || !paymobIframeId) {
      return NextResponse.json(
        { error: 'Missing Paymob environment variables' },
        { status: 500 }
      )
    }

    const amountCents = Math.round(Number(total_price) * 100)

    const authRes = await fetch('https://accept.paymob.com/api/auth/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: paymobApiKey
      })
    })

    const authData = await authRes.json()

    if (!authRes.ok || !authData?.token) {
      return NextResponse.json(
        {
          error: 'Paymob auth failed',
          details: authData
        },
        { status: 502 }
      )
    }

    const paymobOrderRes = await fetch('https://accept.paymob.com/api/ecommerce/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authData.token,
        delivery_needed: false,
        amount_cents: amountCents,
        currency: 'EGP',
        merchant_order_id: insertedOrder.id,
        items: []
      })
    })

    const paymobOrderData = await paymobOrderRes.json()

    if (!paymobOrderRes.ok || !paymobOrderData?.id) {
      return NextResponse.json(
        {
          error: 'Paymob order registration failed',
          details: paymobOrderData
        },
        { status: 502 }
      )
    }

    const fullName = String(customer_name).trim()
    const nameParts = fullName.split(' ').filter(Boolean)
    const firstName = nameParts[0] || 'Customer'
    const lastName = nameParts.slice(1).join(' ') || 'Customer'

    const paymentKeyRes = await fetch('https://accept.paymob.com/api/acceptance/payment_keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        auth_token: authData.token,
        amount_cents: amountCents,
        expiration: 3600,
        order_id: paymobOrderData.id,
        billing_data: {
          apartment: 'NA',
          email: 'checkout@taleenfresh.com',
          floor: 'NA',
          first_name: firstName,
          street: String(customer_address).trim() || 'NA',
          building: 'NA',
          phone_number: String(customer_phone).trim(),
          shipping_method: 'NA',
          postal_code: 'NA',
          city: 'Cairo',
          country: 'EG',
          last_name: lastName,
          state: 'Cairo'
        },
        currency: 'EGP',
        integration_id: Number(paymobIntegrationId)
      })
    })

    const paymentKeyData = await paymentKeyRes.json()

    if (!paymentKeyRes.ok || !paymentKeyData?.token) {
      return NextResponse.json(
        {
          error: 'Paymob payment key generation failed',
          details: paymentKeyData
        },
        { status: 502 }
      )
    }

    const url = `https://accept.paymob.com/api/acceptance/iframes/${paymobIframeId}?payment_token=${paymentKeyData.token}`

    return NextResponse.json(
      {
        success: true,
        orderId: insertedOrder.id,
        url
      },
      { status: 201 }
    )
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal server error processing checkout',
        message: error?.message ?? 'Unknown error'
      },
      { status: 500 }
    )
  }
}
