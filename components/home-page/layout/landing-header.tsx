"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import SignoutButton from "@/components/auth/Signout";
import { useUser } from "@/lib/stores/user";
import { useEffect, useState, useRef, useCallback } from "react";
import { ShieldAlert, Menu, X, User, Settings, LogOut, LayoutDashboard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { logout } from "@/lib/functions/signout";

export function LandingHeader() {
  const setUser = useUser((state) => state.setUserData);
  const { userData } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("features");
  const [isScrolling, setIsScrolling] = useState(false);
  const [pillStyle, setPillStyle] = useState({ width: 84, x: 4 });
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Function to calculate pill position and width based on active nav item
  const updatePillPosition = useCallback((targetSection: string) => {
    if (!navRef.current) return;

    const navContainer = navRef.current;
    const pillContainer = navContainer.parentElement; // The container with padding
    const activeItem = navContainer.querySelector(`[data-nav-item="${targetSection}"]`) as HTMLElement;

    if (activeItem && pillContainer) {
      const containerRect = pillContainer.getBoundingClientRect();
      const itemRect = activeItem.getBoundingClientRect();

      // Calculate position relative to the pill container (not nav container)
      const width = itemRect.width;
      const x = itemRect.left - containerRect.left;

      setPillStyle({ width, x });
    }
  }, []);

  // Update pill position when active section changes
  useEffect(() => {
    // Small delay to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      updatePillPosition(activeSection);
    }, 100);

    return () => clearTimeout(timer);
  }, [activeSection, updatePillPosition]);

  // Update pill position on window resize
  useEffect(() => {
    const handleResize = () => updatePillPosition(activeSection);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeSection, updatePillPosition]);

  // Initial positioning after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      updatePillPosition(activeSection);
    }, 200);

    return () => clearTimeout(timer);
  }, [updatePillPosition]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };

    if (profileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileDropdownOpen]);

  // Enhanced smooth scroll function with scroll state management
  const smoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(targetId);
    if (!targetElement) return;

    // Set scrolling state to prevent intersection observer conflicts
    setIsScrolling(true);

    // Update active section immediately for responsive UI
    setActiveSection(targetId);

    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Get header height for offset
    const header = document.querySelector('header');
    const headerHeight = header ? header.offsetHeight : 0;

    // Calculate positions accounting for header height
    const targetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerHeight;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;

    // Longer duration for smoother scroll
    const duration = 1500;
    let start: number | null = null;

    // Enhanced easing function for smoother animation
    const easeOutQuint = (t: number): number => {
      return 1 - Math.pow(1 - t, 5);
    };

    // Animation function
    const animation = (currentTime: number) => {
      if (start === null) start = currentTime;
      const timeElapsed = currentTime - start;
      const progress = Math.min(timeElapsed / duration, 1);

      // Apply easing
      const easeProgress = easeOutQuint(progress);

      // Smooth scroll with easing
      window.scrollTo({
        top: startPosition + (distance * easeProgress),
        behavior: 'auto' // Use 'auto' to prevent competing with CSS smooth scroll
      });

      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      } else {
        // Reset scrolling state after animation completes
        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 500); // Additional delay to ensure smooth transition
      }
    };

    requestAnimationFrame(animation);
  };

  // Refresh user data when component mounts
  useEffect(() => {
    setUser();
  }, [userData, setUser]);

  // Auto-update active section based on scroll position (only when not manually scrolling)
  useEffect(() => {
    const sections = ['features', 'benefits', 'contact'];

    const observer = new IntersectionObserver(
      (entries) => {
        // Only update if we're not in a manual scroll state
        if (isScrolling) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const sectionId = entry.target.id;
            if (sections.includes(sectionId)) {
              setActiveSection(sectionId);
            }
          }
        });
      },
      {
        threshold: [0.3, 0.5, 0.7],
        rootMargin: '-80px 0px -80px 0px' // Account for header height
      }
    );

    // Observe all sections
    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [isScrolling]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 w-full bg-background/80 backdrop-blur-md z-50 border-b border-border/40"
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <a
            href="#top"
            onClick={(e) => smoothScroll(e, 'top')}
            className="flex items-center gap-3 group"
          >
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl blur-sm"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              <motion.div
                className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-lg"
                whileHover={{
                  rotate: 360,
                  scale: 1.1
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <ShieldAlert className="h-5 w-5 text-primary-foreground" />
              </motion.div>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-primary/80 transition-all duration-300">
              PRISM
            </span>
          </a>
        </motion.div>

        {/* Desktop Navigation with Modern Pill Design */}
        <motion.nav
          className="hidden md:flex items-center relative"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="relative bg-white/5 dark:bg-white/5 backdrop-blur-sm border border-white/10 dark:border-white/10 rounded-2xl px-2 py-1">
            {/* Gliding Pill Indicator */}
            <motion.div
              className="absolute top-1 left-0 h-[calc(100%-8px)] bg-gradient-to-r from-primary/20 via-primary/15 to-primary/20 dark:from-primary/40 dark:via-primary/30 dark:to-primary/40 backdrop-blur-md border border-primary/15 dark:border-primary/30 rounded-xl shadow-lg shadow-primary/10 dark:shadow-primary/20"
              animate={{
                width: pillStyle.width,
                x: pillStyle.x
              }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 0.6,
                duration: 0.4
              }}
            />

            {/* Navigation Items */}
            <div className="relative flex items-center gap-1" ref={navRef}>
              {[
                { id: "features", label: "Features" },
                { id: "benefits", label: "Benefits" },
                { id: "contact", label: "Contact" }
              ].map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1 + 0.4,
                    ease: "easeOut"
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <a
                    href={`#${item.id}`}
                    data-nav-item={item.id}
                    onClick={(e) => {
                      smoothScroll(e, item.id);
                      setActiveSection(item.id);
                    }}
                    className={`
                      relative z-10 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 group
                      ${activeSection === item.id
                        ? "text-primary font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    <span className="relative">
                      {item.label}
                      {/* Hover underline effect */}
                      <span className="absolute -bottom-0.5 left-0 w-0 h-0.5 bg-primary/60 rounded-full transition-all duration-300 group-hover:w-full" />
                    </span>

                    {/* Ripple effect overlay */}
                    <span className="absolute inset-0 rounded-lg bg-primary/5 scale-0 group-active:scale-100 transition-transform duration-200" />
                  </a>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.nav>

        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <motion.button
            className="md:hidden p-2 rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.div
              animate={{ rotate: mobileMenuOpen ? 180 : 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </motion.div>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <ThemeToggle start="top-right" />
          </motion.div>

          {/* Profile Dropdown */}
          <motion.div
            ref={profileDropdownRef}
            className="relative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {userData ? (
              <>
                {/* Profile Icon Button */}
                <motion.button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200 shadow-lg hover:shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <User className="h-5 w-5 text-primary-foreground" />
                </motion.button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 top-12 w-48 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="py-2">
                        <Link
                          href="/dashboard"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-white/5 transition-colors group"
                        >
                          <LayoutDashboard className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                          Go to Dashboard
                        </Link>
                        <div className="h-px bg-border/50 mx-2" />
                        <div
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            logout();
                          }}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-600 dark:hover:text-red-400 transition-colors group cursor-pointer"
                        >
                          <LogOut className="h-4 w-4 group-hover:scale-110 transition-transform" />
                          Sign Out
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            ) : (
              <Link
                href="/signin"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <User className="h-4 w-4" />
                Sign In
              </Link>
            )}
          </motion.div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden bg-background/95 backdrop-blur-md border-b border-border/40 overflow-hidden"
          >
            <div className="container mx-auto px-4 py-4">
              <nav className="flex flex-col gap-2">
                {[
                  { id: "features", label: "Features" },
                  { id: "benefits", label: "Benefits" },
                  { id: "contact", label: "Contact" }
                ].map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.1,
                      ease: "easeOut"
                    }}
                  >
                    <a
                      href={`#${item.id}`}
                      onClick={(e) => {
                        smoothScroll(e, item.id);
                        setActiveSection(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className="block px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 rounded-lg transition-all duration-200"
                    >
                      {item.label}
                    </a>
                  </motion.div>
                ))}
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}