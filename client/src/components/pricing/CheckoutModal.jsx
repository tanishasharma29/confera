import React, { useState } from 'react'
import {
  X,
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Sparkles,
  Zap,
  ArrowRight,
  Check,
  Building,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../config/api'

const CheckoutModal = ({
  isOpen,
  onClose,
  userName = 'Valued Member',
  userEmail = '',
  onSuccess,
}) => {
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' | 'yearly'
  const [paymentMethod, setPaymentMethod] = useState('card') // 'card' | 'gpay' | 'paypal'
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('888')
  const [cardName, setCardName] = useState(userName || 'Tanisha Sharma')

  const [isProcessing, setIsProcessing] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [txId, setTxId] = useState('')

  if (!isOpen) return null

  const monthlyPrice = 19
  const yearlyPriceMonthlyEquivalent = 15
  const yearlyTotal = 180 // 15 * 12 (saves $48)

  const currentPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyTotal
  const displayMonthlyRate = billingCycle === 'monthly' ? monthlyPrice : yearlyPriceMonthlyEquivalent

  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16)
    let formatted = val.match(/.{1,4}/g)?.join(' ') || val
    setCardNumber(formatted)
  }

  const handleExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4)
    if (val.length >= 3) {
      val = `${val.slice(0, 2)}/${val.slice(2)}`
    }
    setCardExpiry(val)
  }

  const handleCvcChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setCardCvc(val)
  }

  const handleSubmitPayment = async (e) => {
    e?.preventDefault?.()
    if (isProcessing) return

    try {
      setIsProcessing(true)

      // Simulate realistic bank / PCI payment authorization
      await new Promise((resolve) => setTimeout(resolve, 1400))

      // Update real backend database to Pro/Premium plan
      const res = await api.post('/api/meetings/plan', {
        plan: 'premium',
        billingCycle,
      })

      if (res.data?.success) {
        const generatedTx = `tx_conf_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`
        setTxId(generatedTx)
        setIsSuccess(true)
        if (onSuccess) {
          onSuccess('premium')
        }
        toast.success('Subscription activated! Welcome to Confera Pro.')
      } else {
        throw new Error('Failed to update plan status')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      toast.error('Payment authorization failed. Please check your credentials.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#22201D] border border-[rgba(234,231,224,0.14)] shadow-2xl overflow-hidden font-sans">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#42B8AD]/12 rounded-full blur-3xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between p-6 border-b border-[rgba(234,231,224,0.08)] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#42B8AD]/15 border border-[#42B8AD]/30 flex items-center justify-center text-[#42B8AD]">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#EAE7E0] flex items-center gap-2">
                <span>Upgrade to Confera Pro</span>
                <span className="px-2 py-0.5 rounded-full bg-[#42B8AD]/15 text-[#42B8AD] text-[10px] font-bold uppercase tracking-wider">
                  Pro Plan
                </span>
              </h2>
              <p className="text-xs text-[#BDBAB3]">
                Instant room capacity upgrade, unlimited calls, and priority AI synthesis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#292724] hover:bg-[#34312d] text-[#BDBAB3] hover:text-[#EAE7E0] flex items-center justify-center transition-colors cursor-pointer border border-[rgba(234,231,224,0.08)]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        {isSuccess ? (
          /* ========================================================
             SUCCESS RECEIPT VIEW
          ======================================================== */
          <div className="p-8 sm:p-10 text-center space-y-6 relative z-10 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-[#42B8AD]/15 border-2 border-[#42B8AD] flex items-center justify-center text-[#42B8AD] mx-auto shadow-xl shadow-[#42B8AD]/20 animate-bounce">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-2xl font-bold text-[#EAE7E0]">Payment Successful!</h3>
              <p className="text-xs text-[#BDBAB3]">
                Your Confera Pro subscription is now active for <span className="text-[#EAE7E0] font-semibold">{userEmail || userName}</span>.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="max-w-md mx-auto p-4 rounded-2xl bg-[#171614] border border-[rgba(234,231,224,0.1)] text-left space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-[rgba(234,231,224,0.08)]">
                <span className="text-[#77736C]">Transaction ID</span>
                <span className="font-mono text-[#42B8AD] text-[11px] font-semibold">{txId}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#77736C]">Plan</span>
                <span className="text-[#EAE7E0] font-semibold">Confera Pro ({billingCycle === 'monthly' ? 'Monthly' : 'Annual'})</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#77736C]">Amount Paid</span>
                <span className="text-[#EAE7E0] font-bold">${currentPrice}.00 USD</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#77736C]">Room Capacity</span>
                <span className="text-[#42B8AD] font-semibold">100 Participants Max</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#77736C]">Status</span>
                <span className="inline-flex items-center gap-1 text-[#42B8AD] font-bold text-[11px]">
                  <Check size={12} /> Active Immediately
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                type="button"
                onClick={onClose}
                className="px-8 py-3 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-[#171614] font-bold text-xs transition-all shadow-lg shadow-[#42B8AD]/25 cursor-pointer"
              >
                Return to Workspace
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================
             CHECKOUT & PAYMENT FORM VIEW
          ======================================================== */
          <div className="grid grid-cols-1 md:grid-cols-5 relative z-10">
            {/* Left Column: Payment Form (3 cols) */}
            <form onSubmit={handleSubmitPayment} className="md:col-span-3 p-6 sm:p-7 space-y-5 border-b md:border-b-0 md:border-r border-[rgba(234,231,224,0.08)]">
              {/* Billing Cycle Switcher */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#BDBAB3]">Billing Cycle</label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#171614] border border-[rgba(234,231,224,0.1)]">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-[#292724] text-[#EAE7E0] shadow-md border border-[rgba(234,231,224,0.12)]'
                        : 'text-[#77736C] hover:text-[#BDBAB3]'
                    }`}
                  >
                    Monthly ($19/mo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      billingCycle === 'yearly'
                        ? 'bg-[#292724] text-[#42B8AD] shadow-md border border-[#42B8AD]/30'
                        : 'text-[#77736C] hover:text-[#BDBAB3]'
                    }`}
                  >
                    <span>Yearly ($15/mo)</span>
                    <span className="px-1.5 py-0.2 rounded bg-[#42B8AD]/20 text-[#42B8AD] text-[9px] font-bold">
                      Save 21%
                    </span>
                  </button>
                </div>
              </div>

              {/* Payment Methods Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#BDBAB3]">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-[#292724] border-[#42B8AD] text-[#EAE7E0]'
                        : 'bg-[#171614] border-[rgba(234,231,224,0.08)] text-[#77736C] hover:text-[#BDBAB3]'
                    }`}
                  >
                    <CreditCard size={14} className={paymentMethod === 'card' ? 'text-[#42B8AD]' : ''} />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('gpay')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
                      paymentMethod === 'gpay'
                        ? 'bg-[#292724] border-[#42B8AD] text-[#EAE7E0]'
                        : 'bg-[#171614] border-[rgba(234,231,224,0.08)] text-[#77736C] hover:text-[#BDBAB3]'
                    }`}
                  >
                    <Zap size={14} className={paymentMethod === 'gpay' ? 'text-[#42B8AD]' : ''} />
                    <span>Pay</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('paypal')}
                    className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
                      paymentMethod === 'paypal'
                        ? 'bg-[#292724] border-[#42B8AD] text-[#EAE7E0]'
                        : 'bg-[#171614] border-[rgba(234,231,224,0.08)] text-[#77736C] hover:text-[#BDBAB3]'
                    }`}
                  >
                    <Building size={14} className={paymentMethod === 'paypal' ? 'text-[#42B8AD]' : ''} />
                    <span>PayPal</span>
                  </button>
                </div>
              </div>

              {/* Card Form Fields */}
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#77736C]">Name on Card</label>
                  <input
                    type="text"
                    required
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. Tanisha Sharma"
                    className="w-full bg-[#171614] border border-[rgba(234,231,224,0.12)] focus:border-[#42B8AD] px-3.5 py-2.5 rounded-xl text-xs text-[#EAE7E0] outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-[#77736C] flex items-center justify-between">
                    <span>Card Information</span>
                    <span className="text-[10px] text-[#42B8AD] flex items-center gap-1">
                      <Lock size={10} /> 256-bit Encrypted
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="4242 4242 4242 4242"
                      className="w-full bg-[#171614] border border-[rgba(234,231,224,0.12)] focus:border-[#42B8AD] pl-10 pr-3.5 py-2.5 rounded-xl text-xs text-[#EAE7E0] outline-none font-mono"
                    />
                    <CreditCard size={15} className="absolute left-3.5 top-3 text-[#77736C]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#77736C]">Expires</label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={handleExpiryChange}
                      placeholder="MM/YY"
                      className="w-full bg-[#171614] border border-[rgba(234,231,224,0.12)] focus:border-[#42B8AD] px-3.5 py-2.5 rounded-xl text-xs text-[#EAE7E0] outline-none font-mono text-center"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-[#77736C]">CVC</label>
                    <input
                      type="password"
                      required
                      value={cardCvc}
                      onChange={handleCvcChange}
                      placeholder="CVC"
                      className="w-full bg-[#171614] border border-[rgba(234,231,224,0.12)] focus:border-[#42B8AD] px-3.5 py-2.5 rounded-xl text-xs text-[#EAE7E0] outline-none font-mono text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Pay Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-[#171614] text-xs font-bold transition-all shadow-lg shadow-[#42B8AD]/20 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#171614] border-t-transparent rounded-full animate-spin" />
                      <span>Processing Secure Payment...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={13} />
                      <span>Pay ${currentPrice}.00 & Activate Pro</span>
                      <ArrowRight size={13} />
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#77736C] text-center pt-1">
                <ShieldCheck size={12} className="text-[#42B8AD]" />
                <span>PCI-DSS Level 1 Certified • Cancel anytime with 1-click</span>
              </div>
            </form>

            {/* Right Column: Order Summary (2 cols) */}
            <div className="md:col-span-2 p-6 sm:p-7 bg-[#1c1b18] flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="space-y-1 pb-3 border-b border-[rgba(234,231,224,0.08)]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#77736C]">
                    Subscription Summary
                  </span>
                  <h4 className="text-base font-bold text-[#EAE7E0]">Confera Pro</h4>
                  <div className="flex items-baseline gap-1 pt-1">
                    <span className="text-2xl font-bold text-[#EAE7E0]">${displayMonthlyRate}</span>
                    <span className="text-xs text-[#77736C]">/ month</span>
                    {billingCycle === 'yearly' && (
                      <span className="text-[10px] text-[#42B8AD] font-semibold ml-1">(billed $180/yr)</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#77736C]">
                    What's Included:
                  </span>
                  <ul className="space-y-2 text-xs text-[#BDBAB3]">
                    <li className="flex items-center gap-2">
                      <Check size={13} className="text-[#42B8AD] shrink-0" />
                      <span>100 participants per room</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={13} className="text-[#42B8AD] shrink-0" />
                      <span>Unlimited monthly meetings</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={13} className="text-[#42B8AD] shrink-0" />
                      <span>High Definition 1080p stream</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={13} className="text-[#42B8AD] shrink-0" />
                      <span>Priority Meeting Memory AI</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check size={13} className="text-[#42B8AD] shrink-0" />
                      <span>Action items delegation export</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="p-3.5 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] space-y-2">
                <div className="flex items-center justify-between text-xs text-[#77736C]">
                  <span>Subtotal</span>
                  <span className="text-[#EAE7E0]">${currentPrice}.00</span>
                </div>
                <div className="flex items-center justify-between text-xs text-[#77736C]">
                  <span>Tax (0%)</span>
                  <span className="text-[#EAE7E0]">$0.00</span>
                </div>
                <div className="pt-2 border-t border-[rgba(234,231,224,0.08)] flex items-center justify-between text-xs font-bold">
                  <span className="text-[#EAE7E0]">Total Due Today</span>
                  <span className="text-base text-[#42B8AD] font-bold">${currentPrice}.00</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CheckoutModal
