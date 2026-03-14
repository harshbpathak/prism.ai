'use client';

import { motion } from "framer-motion";
import { GitBranch, Zap, BarChart2, ArrowRight } from "lucide-react";
import { GlowyButton } from "../components/GlowyButton";

export function TimelineSteps() {

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
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };
    requestAnimationFrame(animation);
  };

  const cardBaseClasses = "bg-[rgba(255,255,255,0.65)] backdrop-blur-[20px] border border-[rgba(255,255,255,0.9)] rounded-[20px] shadow-[0_4px_24px_rgba(99,102,241,0.08),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(37,99,235,0.12),0_2px_8px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:border-[rgba(37,99,235,0.2)] transition-all duration-300 p-8 flex flex-col";
  
  const iconBaseClasses = "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br from-[rgba(37,99,235,0.1)] to-[rgba(124,58,237,0.1)] border border-[rgba(37,99,235,0.15)] shadow-[0_2px_12px_rgba(37,99,235,0.1)]";

  return (
    <section id="how-it-works" className="w-full max-w-7xl mx-auto py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#FAFBFF]">
      
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <div className="inline-flex items-center justify-center px-4 py-1.5 mb-6 rounded-full bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.2)]">
          <span className="text-[#2563EB] text-[11px] font-[600] uppercase tracking-[0.12em]">
            PLATFORM OVERVIEW
          </span>
        </div>
        
        <h2 className="text-[44px] md:text-[48px] font-[700] tracking-[-0.02em] text-[#0F172A] mb-6 leading-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2563EB] to-[#7C3AED]">
            Precision-Grade
          </span> Network Intelligence
        </h2>
        
        <p className="text-[18px] md:text-[20px] font-[400] text-[#64748B] leading-[1.7] max-w-3xl mx-auto">
          Map, stress-test, and harden your operational networks with a unified platform engineered for proactive resilience — not reactive damage control.
        </p>
      </motion.div>

      {/* Bento Grid */}
      <div className="grid lg:grid-cols-3 gap-6 mb-16">
        
        {/* Left 3 Cards Container */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className={`${cardBaseClasses} sm:col-span-2`}
          >
            <div className={iconBaseClasses}>
              <GitBranch className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h3 className="text-[16px] font-[600] text-[#0F172A] mb-3">Network Graph Construction</h3>
            <p className="text-[14px] font-[400] text-[#64748B] leading-relaxed">
              Model your entire operational network as a live, interactive graph — capturing every supplier tier, logistics route, and distribution node. Expose hidden single points of failure before they cascade into costly shutdowns.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className={cardBaseClasses}
          >
            <div className={iconBaseClasses}>
              <Zap className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h3 className="text-[16px] font-[600] text-[#0F172A] mb-3">Fault Injection Probes</h3>
            <p className="text-[14px] font-[400] text-[#64748B] leading-relaxed">
              Inject targeted fault vectors — port closures, supplier insolvencies, demand spikes — and observe how failures propagate across your entire network in real time.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className={cardBaseClasses}
          >
            <div className={iconBaseClasses}>
              <BarChart2 className="w-6 h-6 text-[#2563EB]" />
            </div>
            <h3 className="text-[16px] font-[600] text-[#0F172A] mb-3">Cascade Impact Analysis</h3>
            <p className="text-[14px] font-[400] text-[#64748B] leading-relaxed">
              Quantify downstream damage in real time — financial exposure, operational slowdown, and SLA breach risk — before a single shipment is touched.
            </p>
          </motion.div>
        </div>

        {/* Right Featured Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          viewport={{ once: true }}
          className={`${cardBaseClasses} lg:col-span-1 h-full relative overflow-hidden bg-gradient-to-br from-[rgba(255,255,255,0.7)] to-[rgba(255,255,255,0.4)]`}
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Zap className="w-48 h-48" />
          </div>
          
          <h3 className="text-[20px] font-[600] text-[#0F172A] mb-4 relative z-10">Autonomous Response Engine</h3>
          <p className="text-[14px] font-[400] text-[#64748B] mb-8 leading-relaxed relative z-10">
            The moment a disruption is detected, our AI agents autonomously generate ranked recovery playbooks — ranked by cost, speed, and strategic fit for your operation.
          </p>

          <ul className="space-y-4 mb-auto relative z-10">
            {['Ranked Recovery Playbooks', 'Cost-Yield Optimization', 'Rerouting Intelligence', 'Exposure Containment'].map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] flex items-center justify-center p-[4px]">
                  <ArrowRight className="w-full h-full text-white" />
                </div>
                <span className="text-[15px] font-[500] text-[#0F172A]">{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-6 border-t border-[rgba(0,0,0,0.06)] relative z-10">
            <a 
              href="#features" 
              onClick={(e) => smoothScroll(e, 'features')}
              className="inline-flex items-center text-[15px] font-[600] text-[#2563EB] hover:text-[#7C3AED] transition-colors group"
            >
              Explore capabilities 
              <span className="ml-1 inline-block transform group-hover:translate-x-1 transition-transform">&rarr;</span>
            </a>
          </div>
        </motion.div>

      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="flex justify-center"
      >
        <GlowyButton href="/dashboard" className="px-10 py-4 text-base">
          Launch the Platform &rarr;
        </GlowyButton>
      </motion.div>

    </section>
  );
}

export default TimelineSteps;