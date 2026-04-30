// src/lib/whatsapp.ts
interface CartItem {
  name: string;
  qty: number;
  price: number;
}

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  notes?: string;
}

export const generateWhatsAppCheckout = (
  cart: CartItem[], 
  customer: CustomerInfo, 
  storeNumber: string
) => {
  let total = 0;
  
  let msg = `🛒 *New Order*\n\n`;
  msg += `👤 *Customer:* ${customer.name}\n`;
  msg += `📞 *Phone:* ${customer.phone}\n`;
  msg += `📍 *Address:* ${customer.address}\n\n`;
  msg += `📝 *Order Details:*\n`;
  msg += `------------------------\n`;

  cart.forEach((item) => {
    const itemTotal = item.qty * item.price;
    total += itemTotal;
    // Formatting: 2x Tomatoes - LE 30.00
    msg += `▪️ ${item.qty}kg x ${item.name} - LE ${itemTotal.toFixed(2)}\n`;
  });

  msg += `------------------------\n`;
  msg += `💰 *Total: LE ${total.toFixed(2)}*\n\n`;
  
  if (customer.notes) {
    msg += `💡 *Notes:* ${customer.notes}\n`;
  }

  // Encode for URL safely
  const encodedMessage = encodeURIComponent(msg);
  // Defaulting to wa.me API structure
  return `https://wa.me/${storeNumber.replace('+', '')}?text=${encodedMessage}`;
};
