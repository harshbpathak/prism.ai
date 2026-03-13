"use client"

import { TimelineSteps, LandingHeader, Footer } from "@/components/home-page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  IconWorkflow,
  IconArrowRight,
  IconBarChart2,
  IconActivity,
} from "@/components/home-page/icons"
import { motion } from "framer-motion"
import { GlowyButton } from "@/components/home-page"
import { Hero as FUIHeroWithGridSimple } from "@/components/home-page"
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

export default function Home() {

  const globalRoutes: {
    from: string;
    to: string;
    status: "active" | "delayed" | "disrupted";
  }[] = [
    { from: "Shanghai", to: "Los Angeles", status: "active" },
    { from: "Rotterdam", to: "New York", status: "delayed" },
    { from: "Singapore", to: "Sydney", status: "active" },
    { from: "Mumbai", to: "Dubai", status: "disrupted" },
  ]

  return (
    <div className={inter.className}>
      <LandingHeader />
      
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 -z-20 overflow-hidden">
        <svg
          className="absolute inset-0 h-full w-full stroke-gray-400/30 dark:stroke-white/3 [mask-image:radial-gradient(100%_100%_at_top_center,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="landing-grid-pattern"
              width={200}
              height={200}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y={-1} className="overflow-visible fill-gray-300/20 dark:fill-gray-800/10">
            <path
              d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect
            width="100%"
            height="100%"
            strokeWidth={0}
            fill="url(#landing-grid-pattern)"
          />
        </svg>
        
        {/* Grid Fade Out Effect Before Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-background via-background/95 via-background/80 via-background/60 via-background/40 via-background/20 to-transparent pointer-events-none" />
      </div>
      
      <main id="top" className="flex-1 min-h-screen text-foreground flex flex-col items-center justify-center overflow-hidden relative">
        {/* Abstract background elements with motion */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="fixed inset-0 -z-10 overflow-hidden"
        >
          <motion.div 
            animate={{ 
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ 
              duration: 8, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-1/4 right-1/4 w-96 h-96 rounded-full bg-blue-300 dark:bg-blue-900/30 opacity-20 blur-3xl"
          ></motion.div>
          <motion.div 
            animate={{ 
              x: [0, -40, 0],
              y: [0, 20, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ 
              duration: 10, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-1/3 left-1/3 w-80 h-80 rounded-full bg-purple-300 dark:bg-purple-900/30 opacity-20 blur-3xl"
          ></motion.div>
          <motion.div 
            animate={{ 
              x: [0, 30, 0],
              y: [0, -20, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ 
              duration: 12, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: 4
            }}
            className="absolute top-2/3 right-1/3 w-72 h-72 rounded-full bg-indigo-300 dark:bg-indigo-900/30 opacity-20 blur-3xl"
          ></motion.div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="pt-16 w-full"
        >
          <FUIHeroWithGridSimple />
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          id="features" 
          className="w-full mt-20"
        >
          <TimelineSteps />
        </motion.div>

        {/* Animated Diagram Section with chart placeholders */}
        <motion.section 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          id="benefits"
          className="w-full relative py-20 md:py-32 px-4 bg-gradient-to-b from-transparent via-blue-50/30 to-transparent dark:from-transparent dark:via-blue-900/5 dark:to-transparent overflow-hidden"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 1.5 }}
            viewport={{ once: true }}
            className="absolute inset-0 -z-10"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ 
                duration: 6, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
              className="absolute left-1/3 bottom-0 w-72 h-72 rounded-full bg-blue-300/20 dark:bg-blue-900/10 blur-3xl"
            ></motion.div>
            <motion.div 
              animate={{ 
                scale: [1, 0.8, 1],
                opacity: [0.2, 0.3, 0.2]
              }}
              transition={{ 
                duration: 8, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 3
              }}
              className="absolute right-1/4 top-1/3 w-64 h-64 rounded-full bg-purple-300/20 dark:bg-purple-900/10 blur-3xl"
            ></motion.div>
          </motion.div>
          
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="inline-block mb-3"
              >
                <Badge variant="blue" className="uppercase tracking-wide">
                  Advanced Analytics
                </Badge>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-bold mb-6 text-blue-700 dark:text-blue-400"
              >
                Supply Chain Resilience in Action
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                viewport={{ once: true }}
                className="font-mono text-slate-600 dark:text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed"
              >
                Powerful analytics and visualization tools to help you make data-driven decisions.
              </motion.p>
            </motion.div>
            

                        {/* Analytics Journey */}
              <div className="relative max-w-5xl mx-auto px-4">
                {/* Central Flow Line */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500/20 via-purple-500/20 to-green-500/20 dark:from-blue-400/30 dark:via-purple-400/30 dark:to-green-400/30" />
                
                {/* Data Collection Stage */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative pl-8 md:pl-0 md:pr-[calc(50%+2rem)] mb-16"
                >
                  <div className="absolute left-0 md:left-[calc(50%-1.5rem)] top-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-400" />
                  <Card className="relative dark:bg-slate-950 shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-blue-600 dark:text-blue-400">
                        <IconBarChart2 className="h-5 w-5" />
                        Real-Time Data Collection
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <motion.div 
                          className="text-center"
                          initial={{ scale: 0.8, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          viewport={{ once: true }}
                        >
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">500+</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Sensors</div>
                        </motion.div>
                        <motion.div 
                          className="text-center"
                          initial={{ scale: 0.8, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          viewport={{ once: true }}
                        >
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">24/7</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Monitoring</div>
                        </motion.div>
                        <motion.div 
                          className="text-center"
                          initial={{ scale: 0.8, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          viewport={{ once: true }}
                        >
                          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">1ms</div>
                          <div className="text-sm text-slate-600 dark:text-slate-400">Latency</div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Analysis Stage */}
                <motion.div
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative pl-8 md:pl-[calc(50%+2rem)] mb-16"
                >
                  <div className="absolute left-0 md:left-[calc(50%-1.5rem)] top-0 w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 border-2 border-purple-500 dark:border-purple-400" />
                  <Card className="relative dark:bg-slate-950 shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-purple-600 dark:text-purple-400">
                        <IconActivity className="h-5 w-5" />
                        Intelligent Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="w-1/3 text-sm text-slate-600 dark:text-slate-400">Risk Detection</div>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-purple-500 dark:bg-purple-400 rounded-full"
                              initial={{ width: 0 }}
                              whileInView={{ width: "98.5%" }}
                              transition={{ duration: 1 }}
                              viewport={{ once: true }}
                            />
                          </div>
                          <div className="w-16 text-sm font-medium text-purple-600 dark:text-purple-400">98.5%</div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-1/3 text-sm text-slate-600 dark:text-slate-400">Prediction Accuracy</div>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div 
                              className="h-full bg-purple-500 dark:bg-purple-400 rounded-full"
                              initial={{ width: 0 }}
                              whileInView={{ width: "94.2%" }}
                              transition={{ duration: 1, delay: 0.2 }}
                              viewport={{ once: true }}
                            />
                          </div>
                          <div className="w-16 text-sm font-medium text-purple-600 dark:text-purple-400">94.2%</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Optimization Stage */}
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative pl-8 md:pl-0 md:pr-[calc(50%+2rem)]"
                >
                  <div className="absolute left-0 md:left-[calc(50%-1.5rem)] top-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400" />
                  <Card className="relative dark:bg-slate-950 shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2 text-lg text-green-600 dark:text-green-400">
                        <IconWorkflow className="h-5 w-5" />
                        Continuous Optimization
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <motion.div 
                          className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
                          initial={{ scale: 0.9, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.2 }}
                          viewport={{ once: true }}
                        >
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">32%</div>
                          <div className="text-sm text-green-600/70 dark:text-green-400/70">Cost Reduction</div>
                        </motion.div>
                        <motion.div 
                          className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20"
                          initial={{ scale: 0.9, opacity: 0 }}
                          whileInView={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          viewport={{ once: true }}
                        >
                          <div className="text-xl font-bold text-green-600 dark:text-green-400">45%</div>
                          <div className="text-sm text-green-600/70 dark:text-green-400/70">Faster Delivery</div>
                        </motion.div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* CTA Button */}
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                  className="text-center mt-12"
                >
                  <a href="/analytics" className="btn-donate">
                    <span>Explore Analytics Dashboard</span>
                    <IconArrowRight className="h-4 w-4" />
                  </a>
                </motion.div>
              </div>
            </div>
          </motion.section>
        
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          id="contact"
          className="w-full relative py-20 md:py-32"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/50 dark:from-transparent dark:to-blue-950/10 -z-10"></div>
          <div className="absolute inset-0 overflow-hidden -z-10">
            <svg className="absolute bottom-0 left-0 w-full h-1/3 text-blue-100/50 dark:text-blue-900/20 translate-y-1/4" 
                xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" 
                    fill="currentColor"></path>
            </svg>
          </div>
          
          <div className="container mx-auto px-4 max-w-6xl relative">
            <div className="bg-[#5B21FF] rounded-3xl shadow-2xl p-6 md:p-12 relative overflow-hidden">
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 via-[#5B21FF] to-indigo-600/50"></div>
              {/* Dots Pattern */}
              <div className="absolute inset-0" style={{
                backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.15) 1px, transparent 0)`,
                backgroundSize: '20px 20px'
              }}></div>
              
              {/* Content */}
              <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  viewport={{ once: true }}
                >
                  <Badge variant="outline" className="mb-4 bg-white/10 text-white border-white/20 uppercase tracking-wide text-xs font-medium">
                    Start Today
                  </Badge>
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-white leading-tight">
                    Ready to Transform Your Supply Chain?
                  </h2>
                  <p className="text-gray-200 mb-8 text-base md:text-lg leading-relaxed">
                    Experience the power of AI-driven supply chain resilience. Join industry leaders already using our platform to navigate disruptions with confidence.
                  </p>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <GlowyButton 
                      href="/signin" 
                      className="bg-white hover:bg-gray-50 text-[#5B21FF] shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group justify-center"
                    >
                      <span className="font-medium">Get Started</span>
                      <IconArrowRight className="h-4 w-4 transform transition-transform duration-300 group-hover:translate-x-1" />
                    </GlowyButton>
                    
                    <GlowyButton 
                      href="#features" 
                      className="bg-transparent hover:bg-white/10 text-white border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 justify-center"
                    >
                      <span className="font-medium">Learn More</span>
                    </GlowyButton>
                  </div>
                </motion.div>
                
                {/* Visual Element */}
                <motion.div 
                  className="relative order-first md:order-last"
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  viewport={{ once: true }}
                >
                  <div className="aspect-square max-w-sm mx-auto relative">
                    {/* Animated Background Ring */}
                    <motion.div 
                      className="absolute inset-0 bg-white/5 rounded-3xl"
                      animate={{ 
                        scale: [1, 1.05, 1],
                        opacity: [0.5, 0.8, 0.5]
                      }}
                      transition={{ 
                        duration: 4, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                    />
                    
                    {/* Main Content Card */}
                    <div className="absolute inset-4 flex items-center justify-center">
                      <motion.div 
                        className="w-full h-full rounded-2xl overflow-hidden bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center"
                        whileHover={{ scale: 1.02 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-center p-6">
                          <motion.div 
                            className="relative mb-6"
                            animate={{ 
                              y: [0, -5, 0],
                            }}
                            transition={{ 
                              duration: 3, 
                              repeat: Infinity, 
                              ease: "easeInOut" 
                            }}
                          >
                            <div className="absolute -inset-4 bg-white/10 rounded-full blur-xl"></div>
                            <div className="h-16 w-16 mx-auto rounded-full bg-white/10 flex items-center justify-center relative backdrop-blur-sm border border-white/20">
                              <IconWorkflow className="h-8 w-8 text-white" />
                            </div>
                            
                            {/* Floating Icons */}
                            <motion.div 
                              className="absolute -top-2 -right-2 w-6 h-6 bg-green-400/80 rounded-full flex items-center justify-center"
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7]
                              }}
                              transition={{ 
                                duration: 2, 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                delay: 0.5
                              }}
                            >
                              <div className="w-2 h-2 bg-white rounded-full" />
                            </motion.div>
                            
                            <motion.div 
                              className="absolute -bottom-1 -left-1 w-4 h-4 bg-blue-400/80 rounded-full flex items-center justify-center"
                              animate={{ 
                                scale: [1, 1.3, 1],
                                opacity: [0.6, 1, 0.6]
                              }}
                              transition={{ 
                                duration: 2.5, 
                                repeat: Infinity, 
                                ease: "easeInOut",
                                delay: 1
                              }}
                            >
                              <div className="w-1.5 h-1.5 bg-white rounded-full" />
                            </motion.div>
                          </motion.div>
                          
                          <h3 className="text-lg md:text-xl font-semibold text-white mb-2">
                            Resilient Supply Chains
                          </h3>
                          <p className="text-gray-200 text-sm leading-relaxed">
                            AI-powered optimization and predictive risk management
                          </p>
                          
                          {/* Stats */}
                          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/20">
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">99.9%</div>
                              <div className="text-xs text-gray-300">Uptime</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-white">24/7</div>
                              <div className="text-xs text-gray-300">Support</div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.section>
      </main>
      
      <Footer />
    </div>
  )
}