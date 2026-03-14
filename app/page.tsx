"use client"

import { TimelineSteps, LandingHeader, Footer } from "@/components/home-page"
import { motion } from "framer-motion"
import { GlowyButton } from "@/components/home-page"
import { Hero as FUIHeroWithGridSimple } from "@/components/home-page"
import { Inter } from 'next/font/google'
import Link from 'next/link'
import {
  BarChart2,
  Activity,
  GitBranch,
  ArrowRight,
  TrendingUp,
  Target
} from "lucide-react"

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
})

export default function Home() {

  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1000;
    let start: number | null = null;
    const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);
    
    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);
      const easeProgress = easeOutQuint(progress);
      
      window.scrollTo({ top: startPosition + (distance * easeProgress), behavior: 'auto' });
      
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    };
    requestAnimationFrame(animation);
  };

  const cardBaseClasses = "bg-[rgba(255,255,255,0.65)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.9)] rounded-[20px] shadow-[0_4px_24px_rgba(99,102,241,0.08),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(37,99,235,0.12),0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-[2px] hover:border-[rgba(37,99,235,0.2)] transition-all duration-300";

  return (
    <div className={`${inter.className} bg-[#FAFBFF] min-h-screen font-sans text-[#0F172A] selection:bg-[#2563EB]/20 selection:text-[#2563EB]`}>
      
      {/* 1. Navbar */}
      <LandingHeader />

      <main id="top" className="flex-1 overflow-hidden relative">
        
        {/* 2. Hero */}
        <FUIHeroWithGridSimple />
        
        {/* Alternate background layer spanning timeline & beyond */}
        <div className="absolute top-[800px] left-0 right-0 h-[1000px] bg-[#F4F6FD] -skew-y-3 origin-top-right -z-10" />

        {/* 3. How It Works */}
        <TimelineSteps />

        {/* 4. Advanced Analytics */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          id="benefits"
          className="w-full relative py-20 md:py-32 px-4 bg-[#FAFBFF] z-10 overflow-hidden"
        >
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#F4F6FD] to-transparent -z-10 opacity-50" />
          
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-20"
            >
              <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.2)]">
                <span className="text-[#2563EB] text-[11px] font-[600] uppercase tracking-[0.12em]">
                  ADVANCED ANALYTICS
                </span>
              </div>
              
              <h2 className="text-[44px] md:text-[48px] font-[700] tracking-[-0.02em] text-[#0F172A] mb-6 leading-tight">
                Supply Chain Resilience <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#7C3AED]">in Action</span>
              </h2>
              
              <p className="text-[18px] md:text-[20px] font-[400] text-[#64748B] leading-[1.7] max-w-2xl mx-auto">
                Powerful analytics and visualization tools to help you make data-driven decisions.
              </p>
            </motion.div>
            
            {/* Analytics Journey */}
            <div className="relative max-w-5xl mx-auto px-4 md:px-0">
              
              {/* Central Flow Line */}
              <div className="hidden md:block absolute left-1/2 top-10 bottom-10 w-[1px] bg-[rgba(0,0,0,0.06)] transform -translate-x-1/2" />
              
              {/* Data Collection Stage */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative md:w-1/2 md:pr-12 mb-16 md:ml-0 group"
              >
                <div className="hidden md:block absolute right-[-28px] top-6 w-[12px] h-[12px] rounded-full bg-[#2563EB] ring-4 ring-[#2563EB]/10 z-10 transition-transform group-hover:scale-150" />
                <div className={cardBaseClasses}>
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[rgba(37,99,235,0.1)] to-[rgba(124,58,237,0.1)] border border-[rgba(37,99,235,0.15)] shadow-[0_2px_12px_rgba(37,99,235,0.1)]">
                        <BarChart2 className="w-5 h-5 text-[#2563EB]" />
                      </div>
                      <h3 className="text-[18px] font-[600] text-[#0F172A]">Real-Time Data Collection</h3>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center bg-white/40 rounded-xl py-3 border border-white/60">
                        <div className="text-[28px] font-[700] text-[#0F172A] tracking-tight">500<span className="text-[#2563EB]">+</span></div>
                        <div className="text-[11px] font-[600] text-[#64748B] uppercase tracking-[0.05em]">Sensors</div>
                      </div>
                      <div className="text-center bg-white/40 rounded-xl py-3 border border-white/60">
                        <div className="text-[28px] font-[700] text-[#0F172A] tracking-tight">24/7</div>
                        <div className="text-[11px] font-[600] text-[#64748B] uppercase tracking-[0.05em]">Monitoring</div>
                      </div>
                      <div className="text-center bg-white/40 rounded-xl py-3 border border-white/60">
                        <div className="text-[28px] font-[700] text-[#0F172A] tracking-tight">1<span className="text-[18px] text-[#64748B] font-normal">ms</span></div>
                        <div className="text-[11px] font-[600] text-[#64748B] uppercase tracking-[0.05em]">Latency</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Analysis Stage */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative md:w-1/2 md:pl-12 mb-16 md:ml-auto group"
              >
                <div className="hidden md:block absolute left-[-28px] top-6 w-[12px] h-[12px] rounded-full bg-[#7C3AED] ring-4 ring-[#7C3AED]/10 z-10 transition-transform group-hover:scale-150" />
                <div className={cardBaseClasses}>
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[rgba(124,58,237,0.1)] to-[rgba(37,99,235,0.1)] border border-[rgba(124,58,237,0.15)] shadow-[0_2px_12px_rgba(124,58,237,0.1)]">
                        <Activity className="w-5 h-5 text-[#7C3AED]" />
                      </div>
                      <h3 className="text-[18px] font-[600] text-[#0F172A]">Intelligent Analysis</h3>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-[14px] font-[500] text-[#0F172A]">Risk Detection Rate</span>
                          <span className="text-[14px] font-[600] text-[#7C3AED]">98.5%</span>
                        </div>
                        <div className="h-2 w-full bg-[rgba(37,99,235,0.08)] rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full"
                            style={{ backgroundImage: 'linear-gradient(90deg, #2563EB, #7C3AED)' }}
                            initial={{ width: 0 }}
                            whileInView={{ width: "98.5%" }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            viewport={{ once: true }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-[14px] font-[500] text-[#0F172A]">Prediction Accuracy</span>
                          <span className="text-[14px] font-[600] text-[#7C3AED]">94.2%</span>
                        </div>
                        <div className="h-2 w-full bg-[rgba(37,99,235,0.08)] rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full"
                            style={{ backgroundImage: 'linear-gradient(90deg, #2563EB, #7C3AED)' }}
                            initial={{ width: 0 }}
                            whileInView={{ width: "94.2%" }}
                            transition={{ duration: 1.5, delay: 0.2, ease: "easeOut" }}
                            viewport={{ once: true }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Optimization Stage */}
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative md:w-1/2 md:pr-12 group"
              >
                <div className="hidden md:block absolute right-[-28px] top-6 w-[12px] h-[12px] rounded-full bg-[#10B981] ring-4 ring-[#10B981]/10 z-10 transition-transform group-hover:scale-150" />
                <div className={cardBaseClasses}>
                  <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-[rgba(16,185,129,0.1)] to-[rgba(37,99,235,0.1)] border border-[rgba(16,185,129,0.15)] shadow-[0_2px_12px_rgba(16,185,129,0.1)]">
                        <TrendingUp className="w-5 h-5 text-[#10B981]" />
                      </div>
                      <h3 className="text-[18px] font-[600] text-[#0F172A]">Continuous Optimization</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/40 border border-white/60 rounded-xl p-4 text-center">
                        <div className="text-[32px] font-[700] text-[#10B981] tracking-tight mb-1">32%</div>
                        <div className="text-[13px] font-[500] text-[#64748B] leading-tight">Average Cost<br/>Reduction</div>
                      </div>
                      <div className="bg-white/40 border border-white/60 rounded-xl p-4 text-center">
                        <div className="text-[32px] font-[700] text-[#10B981] tracking-tight mb-1">45%</div>
                        <div className="text-[13px] font-[500] text-[#64748B] leading-tight">Faster Delivery<br/>Times</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              
            </div>
          </div>
        </motion.section>
        
        {/* 5. Stats / Metrics bar */}
        {/* Metrics are integrated above gracefully. No separate bar required for 3-part layout. */}

        {/* 6. Final CTA section */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          id="features"
          className="w-full relative py-20 px-4 mb-20 z-10"
        >
          <div className="max-w-5xl mx-auto">
            <div className="relative rounded-[32px] overflow-hidden bg-gradient-to-br from-[#1E293B] to-[#0F172A] p-10 md:p-16 shadow-2xl">
              
              {/* Decorative elements inside CTA card */}
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <Target className="w-[300px] h-[300px] text-white transform rotate-12" />
              </div>
              <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-[#2563EB] rounded-full blur-[100px] opacity-40 mix-blend-screen" />
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-[#7C3AED] rounded-full blur-[100px] opacity-40 mix-blend-screen" />

              <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-white/10 border border-white/20">
                    <span className="text-white text-[11px] font-[600] uppercase tracking-[0.12em]">
                      START TODAY
                    </span>
                  </div>
                  
                  <h2 className="text-[36px] md:text-[42px] font-[700] tracking-[-0.02em] text-white leading-tight mb-6">
                    Ready to Transform Your Supply Chain?
                  </h2>
                  
                  <p className="text-[16px] md:text-[18px] text-[#94A3B8] leading-[1.7] mb-10 max-w-lg">
                    Experience the power of AI-driven supply chain resilience. Join industry leaders already using our platform to navigate disruptions with confidence.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 px-8 py-3.5 text-[#0F172A] bg-white shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_40px_rgba(255,255,255,0.3)] hover:-translate-y-[2px]"
                    >
                      <span className="flex items-center gap-2">
                        Get Started
                        <ArrowRight className="w-5 h-5 text-[#2563EB]" />
                      </span>
                    </Link>
                    <a
                      href="#features" 
                      onClick={(e) => smoothScroll(e, 'features')}
                      className="inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 px-8 py-3.5 text-white bg-white/10 border border-white/20 hover:bg-white/20 hover:-translate-y-[2px]"
                    >
                      Learn More
                    </a>
                  </div>
                </div>

                <div className="hidden md:flex justify-end">
                  {/* Decorative Glass Component inside CTA */}
                  <div className="w-[280px] h-[320px] rounded-[24px] bg-white/5 border border-white/10 backdrop-blur-xl p-6 relative shadow-[0_8px_40px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center text-center transform rotate-3 hover:rotate-0 transition-transform duration-500">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center mb-6 shadow-lg">
                      <GitBranch className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-white font-[600] text-[20px] mb-2">Resilient Systems</h3>
                    <p className="text-[#94A3B8] text-[14px] leading-relaxed mb-6">
                      AI-powered optimization and predictive risk management.
                    </p>
                    <div className="w-full grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                      <div>
                        <div className="text-white font-[700] text-[20px]">99.9%</div>
                        <div className="text-[#94A3B8] text-[12px] uppercase tracking-wide mt-1">Uptime</div>
                      </div>
                      <div>
                        <div className="text-white font-[700] text-[20px]">24/7</div>
                        <div className="text-[#94A3B8] text-[12px] uppercase tracking-wide mt-1">Support</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
      
      {/* 7. Footer */}
      <Footer />
    </div>
  )
}