"use client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AnimatedFeatureCard from "./animated-feature-card";
import { 
  IconSquareStack,
  IconWaves,
  IconTrendingUp,
  IconTarget,
  IconArrowRight,
  IconSparkles
} from "../icons";

const TIMELINE_STEPS = [
  {
    title: "Build Digital Twin",
    description: "Map your supply chain with an interactive drag-and-drop editor.",
    color: "from-blue-600 to-blue-400",
    icon: IconSquareStack,
    features: ["Interactive Mapping", "Real-time Visualization"],
  },
  {
    title: "Simulate Disruption",
    description: "Run AI-powered scenarios for natural disasters, supplier failures, and more.",
    color: "from-rose-500 to-pink-400",
    icon: IconWaves,
    features: ["AI Scenarios", "Multi-Risk Analysis"],
  },
  {
    title: "Assess Impact",
    description: "Visualize cost, delay, and inventory effects in real time.",
    color: "from-violet-600 to-indigo-400",
    icon: IconTrendingUp,
    features: ["Real-time Analytics", "Cost Modeling"],
  },
  {
    title: "Get Recommendations",
    description: "Receive smart, cost-effective mitigation strategies and ROI analysis.",
    color: "from-amber-500 to-yellow-400",
    icon: IconTarget,
    features: ["Smart Strategies", "ROI Analysis"],
  },
];

export function TimelineSteps() {
  return (
    <section className="w-full max-w-7xl mx-auto py-20 md:py-32 px-4 relative overflow-hidden">
      {/* Enhanced Background Elements */}
      <div className="absolute inset-0 -z-10">
        {/* Primary gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30 dark:from-blue-900/10 dark:via-indigo-900/5 dark:to-purple-900/10" />
        
        {/* Floating gradient orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-2xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        
        {/* Geometric elements */}
        <div className="absolute top-10 right-10 w-6 h-6 border border-blue-300/30 dark:border-blue-700/30 rotate-45 animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-20 left-20 w-4 h-4 bg-gradient-to-br from-indigo-400/20 to-purple-400/20 rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <div className="inline-block mb-4 px-4 py-2 rounded-full bg-gradient-to-r from-blue-100/80 via-indigo-100/60 to-purple-100/80 dark:from-blue-900/30 dark:via-indigo-900/20 dark:to-purple-900/30 backdrop-blur-sm border border-blue-200/30 dark:border-blue-800/30">
          <span className="text-blue-700 dark:text-blue-300 text-sm font-medium uppercase tracking-wide flex items-center gap-2">
            <IconSparkles className="h-4 w-4" />
            How It Works
          </span>
        </div>
        
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-700 via-indigo-600 to-violet-700 dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400 bg-clip-text text-transparent leading-tight">
          AI-Powered Supply Chain Intelligence
        </h2>
        
        <p className="font-mono text-slate-600 dark:text-slate-300 max-w-3xl mx-auto text-lg md:text-xl leading-relaxed">
          Transform disruptions into opportunities with our comprehensive four-step process that combines AI intelligence with real-world supply chain expertise.
        </p>
      </motion.div>

      {/* Timeline Steps */}
      <div className="relative">
        {/* Connecting line for desktop */}
        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 via-violet-200 to-amber-200 dark:from-blue-800 dark:via-indigo-800 dark:via-violet-800 dark:to-amber-800 transform -translate-y-1/2 z-0" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
          {TIMELINE_STEPS.map((step, idx) => {
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                viewport={{ once: true }}
                className="relative z-10 flex flex-col items-center"
              >
                <AnimatedFeatureCard
                  title={step.title}
                  description={step.description}
                  stepIndex={idx}
                  className="w-full max-w-sm mx-auto"
                />
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Call to action */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        viewport={{ once: true }}
        className="text-center mt-16"
      >
        <a 
          href="/digital-twin"
          className="btn-donate inline-flex items-center gap-2"
          style={{
            '--clr-font-main': 'hsla(0 0% 20% / 100)',
            '--btn-bg-1': 'hsla(194 100% 69% / 1)',
            '--btn-bg-2': 'hsla(217 100% 56% / 1)',
            '--btn-bg-color': 'hsla(360 100% 100% / 1)',
            '--radii': '0.5em',
            cursor: 'pointer',
            padding: '0.9em 1.4em',
            minWidth: '120px',
            minHeight: '44px',
            fontSize: 'var(--size, 1rem)',
            fontWeight: '500',
            transition: '0.8s',
            backgroundSize: '280% auto',
            backgroundImage: 'linear-gradient(325deg, var(--btn-bg-2) 0%, var(--btn-bg-1) 55%, var(--btn-bg-2) 90%)',
            border: 'none',
            borderRadius: 'var(--radii)',
            color: 'var(--btn-bg-color)',
            boxShadow: '0px 0px 20px rgba(71, 184, 255, 0.5), 0px 5px 5px -1px rgba(58, 125, 233, 0.25), inset 4px 4px 8px rgba(175, 230, 255, 0.5), inset -4px -4px 8px rgba(19, 95, 216, 0.35)',
            textDecoration: 'none'
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundPosition = 'right top';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundPosition = 'left top';
          }}
          onFocus={(e) => {
            e.currentTarget.style.outline = 'none';
            e.currentTarget.style.boxShadow = '0 0 0 3px var(--btn-bg-color), 0 0 0 6px var(--btn-bg-2)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.boxShadow = '0px 0px 20px rgba(71, 184, 255, 0.5), 0px 5px 5px -1px rgba(58, 125, 233, 0.25), inset 4px 4px 8px rgba(175, 230, 255, 0.5), inset -4px -4px 8px rgba(19, 95, 216, 0.35)';
          }}
        >
          <span className="font-medium">See It In Action</span>
          <IconArrowRight className="h-4 w-4" />
        </a>
      </motion.div>
    </section>
  );
}