'use client';

import { motion } from "framer-motion";
import { GlowyButton } from "../components/GlowyButton";

const FUIHeroWithGridSimple = () => {
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

  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const wordAnimation = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  };

  const titleText = "Know Every Risk Before It Becomes a Crisis";
  const words = titleText.split(" ");

  return (
    <section className="relative min-h-[700px] w-full pt-16 lg:pt-24 pb-20 overflow-hidden bg-[#FAFBFF]">
      {/* Radial Gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0" 
          style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.08) 0%, transparent 70%)' }}
        />
        <div 
          className="absolute inset-0" 
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(124,58,237,0.06) 0%, transparent 70%)' }}
        />
      </div>

      {/* Dot Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-[0.15]"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(37,99,235,1) 1px, transparent 1px)',
          backgroundSize: '28px 28px'
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col items-center text-center">
          
          <div className="space-y-8 max-w-4xl flex flex-col items-center">
            {/* Badge */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="inline-flex relative p-[1px] rounded-full overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#2563EB]/50 to-transparent animate-[shimmer_2s_infinite]" />
              <div className="bg-[#FAFBFF] px-4 py-1.5 rounded-full border border-[#2563EB]/10 relative z-10">
                <span className="text-sm font-semibold text-[#0F172A] tracking-wide relative z-20">
                  <span className="text-[#2563EB] mr-1">⬡</span> Powered by Multi-Agent AI
                </span>
              </div>
            </motion.div>

            {/* H1 */}
            <motion.h1 
              variants={staggerContainer}
              initial="hidden"
              animate="show"
              className="text-[44px] md:text-5xl lg:text-[72px] font-[800] tracking-[-0.03em] leading-[1.05] text-[#0F172A]"
            >
              {words.map((word, i) => (
                <motion.span 
                  key={i} 
                  variants={wordAnimation}
                  className={`inline-block mr-[0.25em] ${word === "Every" || word === "Risk" ? "text-transparent bg-clip-text bg-gradient-to-br from-[#2563EB] to-[#7C3AED]" : ""}`}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            {/* Subtext */}
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-[20px] font-normal text-[#64748B] leading-[1.7] max-w-2xl"
            >
              We simulate your supply chain as a living digital twin and deploy autonomous AI agents to surface risks before they cascade into disruptions.
            </motion.p>

            {/* Buttons */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.55 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full"
            >
              <GlowyButton href="/dashboard" className="w-full sm:w-auto">
                Get Started
              </GlowyButton>
              <GlowyButton 
                href="#how-it-works" 
                variant="ghost" 
                onClick={(e: React.MouseEvent<HTMLAnchorElement>) => smoothScroll(e, 'how-it-works')}
                className="w-full sm:w-auto"
              >
                See It In Action &rarr;
              </GlowyButton>
            </motion.div>

            {/* Social Proof */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
              className="flex flex-col items-center gap-4 pt-6"
            >
              <div className="flex -space-x-3">
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full border-2 border-white relative z-10"
                    style={{
                      background: `linear-gradient(135deg, ${
                        ['#2563EB', '#3B82F6', '#60A5FA', '#7C3AED', '#8B5CF6'][i]
                      }, ${
                        ['#1D4ED8', '#2563EB', '#3B82F6', '#6D28D9', '#7C3AED'][i]
                      })`
                    }}
                  />
                ))}
              </div>
              <p className="text-[13px] font-medium text-[#64748B]">
                Trusted by logistics teams across 40+ countries
              </p>
            </motion.div>
          </div>

        </div>
      </div>
      
      {/* Inline styles */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </section>
  );
};

export default FUIHeroWithGridSimple;
