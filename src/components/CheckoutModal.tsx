"use client";

import { useEffect, useState } from "react";
import {
  Loader2, CheckCircle2, AlertCircle, ShieldCheck
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useShop } from "@/contexts/ShopContext";
import { toast } from "sonner";
import { formatPrice } from "@/lib/utils";
import DOMPurify from "isomorphic-dompurify";

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

const EMAIL_REGEX = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

type Step = "details" | "processing" | "done";

export default function CheckoutModal({ open, onClose }: CheckoutModalProps) {
  const { cart, cartTotal, cartCount, clearCart } = useShop();
  const [step, setStep] = useState<Step>("details");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Contact / shipping
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("India");

  // Coupon
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const VALID_COUPONS: Record<string, { type: "percent"; value: number; label: string }> = {
    FYNDS20: { type: "percent", value: 20, label: "20% off" },
    FYNDS10: { type: "percent", value: 10, label: "10% off" },
  };

  useEffect(() => {
    // Dynamically load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { toast.error("Please enter a coupon code."); return; }
    const coupon = VALID_COUPONS[code];
    if (!coupon) { toast.error("Invalid coupon code."); return; }
    if (appliedCoupon === code) { toast.error("Coupon already applied."); return; }
    setAppliedCoupon(code);
    const discount = Math.round((cartTotal * coupon.value) / 100);
    setCouponDiscount(discount);
    toast.success(`Coupon applied! You save ₹${discount.toLocaleString('en-IN')}`);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponInput("");
    toast.info("Coupon removed.");
  };

  const shippingCost = cartTotal > 999 ? 0 : 99;
  const total = cartTotal - couponDiscount + shippingCost;

  const handleContinueToPayment = async () => {
    const sanitizedEmail = DOMPurify.sanitize(email.trim()).toLowerCase();
    if (!name.trim()) { toast.error("Please enter your full name."); return; }
    if (!sanitizedEmail || !EMAIL_REGEX.test(sanitizedEmail)) { toast.error("Please enter a valid email."); return; }
    if (!phone.trim()) { toast.error("Please enter your phone number."); return; }
    if (!address.trim()) { toast.error("Please enter your street address."); return; }
    if (!city.trim()) { toast.error("Please enter your city."); return; }
    if (!stateName.trim()) { toast.error("Please enter your state."); return; }
    if (!zip.trim()) { toast.error("Please enter your PIN code."); return; }
    if (cart.length === 0) { toast.error("Your cart is empty."); return; }

    setIsSubmitting(true);
    setStep("processing");

    try {
      // 1. Create order in our DB
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: Number(item.id),
            productName: item.name,
            productImage: item.image,
            quantity: item.quantity,
            price: item.price,
            selectedSize: item.selectedSize ?? "One Size",
            selectedColor: item.selectedColor ?? "Default",
          })),
          subtotal: cartTotal,
          discount: couponDiscount,
          couponCode: appliedCoupon ?? undefined,
          shipping: shippingCost,
          tax: 0,
          total,
          shippingName: name.trim(),
          shippingEmail: sanitizedEmail,
          shippingPhone: phone.trim(),
          shippingAddress: address.trim(),
          shippingCity: city.trim(),
          shippingState: stateName.trim(),
          shippingZip: zip.trim(),
          shippingCountry: country.trim(),
          paymentMethod: "razorpay",
          status: "pending_payment",
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to place order in database");
      }
      const order = await res.json();

      // 2. Initialize Razorpay order
      const rzpRes = await fetch("/api/checkout/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: total,
          receipt: order.orderNumber,
        }),
      });

      if (!rzpRes.ok) {
        throw new Error("Failed to initialize Razorpay checkout");
      }
      const rzpOrder = await rzpRes.json();

      // 3. Open Razorpay Checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder", 
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "FashionFynds",
        description: `Order ${order.orderNumber}`,
        order_id: rzpOrder.id,
        handler: async function (response: any) {
          // 4. Verify payment
          const verifyRes = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              order_number: order.orderNumber,
            }),
          });
          
          if (verifyRes.ok) {
            clearCart();
            setStep("done");
          } else {
            toast.error("Payment verification failed. If money was deducted, contact support.");
            setStep("details");
          }
        },
        prefill: {
          name: name.trim(),
          email: sanitizedEmail,
          contact: phone.trim(),
        },
        theme: {
          color: "#0f172a",
        },
        modal: {
          ondismiss: function() {
            setStep("details");
            setIsSubmitting(false);
            toast.info("Payment cancelled.");
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        toast.error("Payment failed. Please try again.");
      });
      rzp.open();

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
      setStep("details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setStep("details");
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponDiscount(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            {step === "details" && "Shipping Details"}
            {step === "processing" && "Processing Payment"}
            {step === "done" && "Order Placed!"}
            {(step === "details" || step === "processing") && <ShieldCheck className="w-5 h-5 text-green-500" />}
          </DialogTitle>
        </DialogHeader>

        {/* ── STEP 1: Shipping details ── */}
        {step === "details" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="co-name">Full Name *</Label>
                <Input id="co-name" placeholder="Jane Smith" value={name}
                  onChange={(e) => setName(e.target.value)} className="mt-1" maxLength={100} />
              </div>
              <div>
                <Label htmlFor="co-email">Email *</Label>
                <Input id="co-email" type="email" placeholder="you@email.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="mt-1" maxLength={254} />
              </div>
              <div>
                <Label htmlFor="co-phone">Phone *</Label>
                <Input id="co-phone" type="tel" placeholder="+91 98765 43210" value={phone}
                  onChange={(e) => setPhone(e.target.value)} className="mt-1" maxLength={20} />
              </div>
              <div>
                <Label htmlFor="co-country">Country</Label>
                <Input id="co-country" placeholder="India" value={country}
                  onChange={(e) => setCountry(e.target.value)} className="mt-1" maxLength={60} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Shipping Address *</Label>
              <Input placeholder="Street address / flat / area" value={address}
                onChange={(e) => setAddress(e.target.value)} maxLength={200} />
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="City" value={city}
                  onChange={(e) => setCity(e.target.value)} maxLength={100} />
                <Input placeholder="State" value={stateName}
                  onChange={(e) => setStateName(e.target.value)} maxLength={100} />
                <Input placeholder="PIN code" value={zip}
                  onChange={(e) => setZip(e.target.value)} maxLength={20} />
              </div>
            </div>

            <Separator />

            {/* Coupon code */}
            <div className="space-y-2">
              <Label>Coupon Code</Label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                    🎉 {appliedCoupon} — {VALID_COUPONS[appliedCoupon].label} applied
                  </span>
                  <button onClick={removeCoupon} className="text-xs text-red-500 hover:text-red-700 font-medium ml-2">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    maxLength={20}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" onClick={applyCoupon} className="shrink-0">Apply</Button>
                </div>
              )}
            </div>

            {/* Order summary */}
            <div className="text-sm space-y-1">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({cartCount} items)</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount ({appliedCoupon})</span>
                  <span>−{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{shippingCost === 0 ? "FREE" : formatPrice(shippingCost)}</span>
              </div>
              {shippingCost > 0 && (
                <p className="text-xs text-muted-foreground">Free shipping on orders over ₹999</p>
              )}
              <Separator className="my-1" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <Button className="w-full text-lg h-12 relative overflow-hidden group" onClick={handleContinueToPayment} disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Initializing Secure Checkout…</>
              ) : (
                <>Pay {formatPrice(total)} Securely</>
              )}
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
            </Button>
            <div className="flex justify-center items-center gap-1.5 text-xs text-muted-foreground mt-2">
               <ShieldCheck className="w-3.5 h-3.5" /> 100% Secure Payments by Razorpay
            </div>
          </div>
        )}

        {/* ── STEP 2: Processing ── */}
        {step === "processing" && (
          <div className="space-y-6 text-center py-10">
             <div className="relative w-24 h-24 mx-auto">
                <Loader2 className="w-24 h-24 animate-spin text-primary opacity-20" />
                <ShieldCheck className="w-10 h-10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary" />
             </div>
             <div>
                <h3 className="text-xl font-bold">Secure Checkout</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Please complete the payment in the Razorpay window.<br/>
                  Do not refresh or close this page.
                </p>
             </div>
          </div>
        )}

        {/* ── STEP 3: Done ── */}
        {step === "done" && (
          <div className="space-y-5 text-center py-4">
            <CheckCircle2 className="h-16 w-16 mx-auto text-green-500" />
            <div>
              <h3 className="text-lg font-bold">Order Confirmed!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your payment was successful. We have received your order and will process it shortly.
              </p>
            </div>
            <div className="bg-muted rounded-lg p-4 text-left text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-bold">{formatPrice(total)}</span>
              </div>
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
