// src/components/customer/floating-cart/CartItemRow.tsx

'use client'

import React from 'react'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartDisplayItem } from '@/types/customer/floating-cart'
import {
  getItemMinQty,
  getItemStep,
  getItemUnit,
} from '@/lib/customer/floating-cart-utils'

interface CartItemRowProps {
  item: CartDisplayItem
  updateQty: (id: string, qty: number) => void; 
  removeItem: (id: string) => void; 
}

export function CartItemRow({
  item,
  updateQty,
  removeItem,
}: CartItemRowProps) {
  const unit = getItemUnit(item.name, item.category)
  const step = getItemStep(unit)
  const minQty = getItemMinQty(unit)

  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border p-3">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h4 className="truncate text-sm font-bold text-gray-800">{item.name}</h4>
        <span className="shrink-0 rounded-md bg-green-50 px-2 py-0.5 text-xs font-bold text-[#2C643E]">
          {(item.price * item.qty).toFixed(2)} ج.م
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-2" dir="ltr">
        <div className="flex items-center gap-1 rounded-lg border bg-gray-50 p-0.5">
          <button
            type="button"
            onClick={() => updateQty(item.id, Math.max(minQty, item.qty - step))}
            aria-label={`تقليل كمية ${item.name}`}
            className="rounded-md p-1.5 text-gray-600 transition-colors hover:bg-gray-200"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <span className="w-14 text-center text-sm font-bold text-gray-700">
            {item.qty} {unit}
          </span>

          <button
            type="button"
            onClick={() => updateQty(item.id, item.qty + step)}
            aria-label={`زيادة كمية ${item.name}`}
            className="rounded-md bg-white p-1.5 text-[#2C643E] shadow-sm transition-colors hover:bg-green-50"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => removeItem(item.id)}
          aria-label={`حذف ${item.name}`}
          className="rounded-lg bg-red-50 p-2 text-red-500 transition-colors hover:bg-red-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
