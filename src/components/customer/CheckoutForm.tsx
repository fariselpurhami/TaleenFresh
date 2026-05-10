// src/components/customer/CheckoutForm.tsx

"use client";

import * as React from 'react';

import { useCheckout, type CustomerInfo } from '@/store/useCheckout';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function CheckoutForm() {
  const { customerInfo, setCustomerInfo } = useCheckout();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setCustomerInfo({ [name]: value } as Partial<CustomerInfo>);
    },
    [setCustomerInfo]
  );

  if (!mounted) {
    return (
      <form className="flex w-full flex-col gap-4" aria-busy="true">
        <div className="space-y-2">
          <Label htmlFor="fullName">الاسم بالكامل</Label>
          <Input id="fullName" name="fullName" disabled placeholder="الاسم بالكامل" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">رقم التليفون</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            dir="ltr"
            disabled
            placeholder="01xxxxxxxxx"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">العنوان بالتفصيل</Label>
          <Textarea
            id="address"
            name="address"
            disabled
            placeholder="العنوان بالتفصيل"
            className="min-h-[100px] resize-y"
          />
        </div>
      </form>
    );
  }

  return (
    <form className="flex w-full flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <div className="space-y-2">
        <Label htmlFor="fullName">الاسم بالكامل</Label>
        <Input
	  data-testid="input-customer-name"
          id="fullName"
          name="fullName"
          value={customerInfo.fullName}
          onChange={handleInputChange}
          placeholder="الاسم بالكامل"
          required
          autoComplete="name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">رقم التليفون</Label>
        <Input
	  data-testid="input-customer-phone"
          id="phone"
          name="phone"
          type="tel"
          dir="ltr"
          value={customerInfo.phone}
          onChange={handleInputChange}
          placeholder="01xxxxxxxxx"
          required
          autoComplete="tel"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="address">العنوان بالتفصيل</Label>
        <Textarea
          id="address"
          name="address"
          value={customerInfo.address}
          onChange={handleInputChange}
          placeholder="العنوان بالتفصيل"
          className="min-h-[100px] resize-y"
          required
          autoComplete="street-address"
        />
      </div>
    </form>
  );
}
