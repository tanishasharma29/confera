import React, { useEffect, useState } from 'react'
import { PricingTable } from '@clerk/react'
import { Sparkles, Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../config/api'

const Pricing = () => {
  const navigate = useNavigate()
  const [currentPlan, setCurrentPlan] = useState('free')

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await api.get('/api/meetings/stats')
        if (res.data?.plan) {
          setCurrentPlan(res.data.plan.toLowerCase())
        }
      } catch {
        // Default to free
      }
    }
    fetchPlan()
  }, [])

  return (
    <div className="relative min-h-full">
      {/* ========================================================
          Pricing Ambient Aurora Canvas (Premium Charcoal & Subtle Teal)
      ======================================================== */}
      <div className="pricing-ambient-canvas" aria-hidden="true">
        <div className="pricing-aurora-glow-1" />
        <div className="pricing-aurora-glow-2" />
        <div className="confera-aurora-veil" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 font-sans">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#22201D]/90 border border-[rgba(234,231,224,0.12)] text-xs text-[#42B8AD]">
            <Sparkles size={13} />
            <span>Plans for Teams & Individuals</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#EAE7E0]">
            Predictable, transparent pricing
          </h1>
          <p className="text-xs sm:text-sm text-[#BDBAB3]">
            Scale your meetings, extend room capacity up to 100 participants, and leverage unlimited Meeting Memory synthesis.
          </p>
        </div>

        {/* Pricing Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Free Plan */}
          <div className="p-6 sm:p-8 rounded-3xl bg-pricing-free flex flex-col justify-between space-y-6 overflow-hidden">
            <div className="space-y-4 relative z-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#77736C]">
                  Free Plan
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#EAE7E0]">$0</span>
                  <span className="text-xs text-[#77736C]">/ month</span>
                </div>
                <p className="text-xs text-[#BDBAB3] mt-2 leading-relaxed">
                  Ideal for individuals and small teams hosting quick syncs.
                </p>
              </div>

              <ul className="space-y-2.5 pt-2">
                {[
                  '30 meetings per calendar month',
                  'Up to 10 participants per room',
                  'Peer-to-peer encrypted calls',
                  'In-meeting chat & screen sharing',
                  'Meeting Memory summaries',
                ].map((feat, i) => (
                  <li key={i} className="text-xs text-[#EAE7E0] flex items-center gap-2.5">
                    <Check size={14} className="text-[#42B8AD] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={`w-full py-3 rounded-xl text-xs font-semibold border transition-all relative z-10 cursor-pointer ${
                currentPlan === 'free'
                  ? 'bg-[#292724] text-[#EAE7E0] border-[rgba(234,231,224,0.12)]'
                  : 'bg-[#22201D] text-[#77736C] border-transparent'
              }`}
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Downgrade to Free'}
            </button>
          </div>

          {/* Premium Plan */}
          <div className="p-6 sm:p-8 rounded-3xl bg-pricing-pro flex flex-col justify-between space-y-6 relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#42B8AD]/12 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute top-4 right-4 relative z-10">
              <span className="px-3 py-1 rounded-full bg-[#42B8AD]/15 text-[#42B8AD] border border-[#42B8AD]/30 text-[10px] font-bold uppercase tracking-wider">
                Recommended
              </span>
            </div>

            <div className="space-y-4 relative z-10">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#42B8AD]">
                  Pro Plan
                </span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-[#EAE7E0]">$19</span>
                  <span className="text-xs text-[#77736C]">/ month</span>
                </div>
                <p className="text-xs text-[#BDBAB3] mt-2 leading-relaxed">
                  For organizations that require unlimited meetings and larger audiences.
                </p>
              </div>

              <ul className="space-y-2.5 pt-2">
                {[
                  'Unlimited monthly meetings',
                  'Up to 100 participants per room',
                  'High Definition 1080p video stream',
                  'Priority Meeting Memory synthesis',
                  'Action Tracker export & team delegation',
                  '24/7 dedicated support',
                ].map((feat, i) => (
                  <li key={i} className="text-xs text-[#EAE7E0] flex items-center gap-2.5">
                    <Check size={14} className="text-[#42B8AD] shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="w-full relative z-10">
              <PricingTable />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Pricing
