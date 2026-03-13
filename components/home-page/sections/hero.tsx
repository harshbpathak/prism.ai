'use client';
import { ChevronRight } from "lucide-react";
import LinkItem from "../components/LinkItem";
import { IconGithub, IconArrowRight } from "../icons";
import HeroAnimated from "../components/HeroAnimated";
import BgGradient from "../components/BgGradient";
import {
  VideoPlayer,
  VideoPlayerContent,
  VideoPlayerControlBar,
  VideoPlayerMuteButton,
  VideoPlayerPlayButton,
  VideoPlayerSeekBackwardButton,
  VideoPlayerSeekForwardButton,
  VideoPlayerTimeDisplay,
  VideoPlayerTimeRange,
  VideoPlayerVolumeRange,
  VideoPlayerFullscreenButton,
} from '../components/video-player';

const FUIHeroWithGridSimple = () => {
  return (
    <>
      <section className="min-h-[800px] w-full mt-0 relative overflow-hidden bg-gradient-to-br from-blue-50/80 via-indigo-50/60 to-purple-50/80 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
        
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0">
          {/* Background Gradient - Different for light/dark */}
          <div className="absolute -top-0 inset-x-0 opacity-40 dark:opacity-25">
            <BgGradient variant="blue" />
          </div>
          
          {/* Light Mode Background Layers */}
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-100/30 via-blue-100/40 to-indigo-100/30 dark:opacity-0" />
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-100/20 via-transparent to-pink-100/20 dark:opacity-0" />
        </div>

        {/* Light Mode Subtle Orbs */}
        <div className="absolute inset-0 dark:opacity-0">
          {/* Subtle floating orb - top right */}
          <div className="absolute top-32 right-32 w-48 h-48 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-full blur-3xl" />
          
          {/* Small floating orb - bottom left */}
          <div className="absolute bottom-40 left-40 w-32 h-32 bg-gradient-to-br from-purple-200/25 to-pink-300/25 rounded-full blur-2xl" />
        </div>

        {/* Enhanced Grid Pattern */}
        <svg
          className="absolute inset-0 z-1 h-full w-full stroke-gray-400/70 dark:stroke-gray-600/30 [mask-image:radial-gradient(100%_100%_at_top_left,white,transparent)]"
          aria-hidden="true"
        >
          <defs>
            <pattern
              id="983e3e4c-de6d-4c3f-8d64-b9761d1534cc"
              width={200}
              height={200}
              x="50%"
              y={-1}
              patternUnits="userSpaceOnUse"
            >
              <path d="M.5 200V.5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y={-1} className="overflow-visible fill-gray-300/40 dark:fill-gray-700/20">
            <path
              d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect
            width="100%"
            height="100%"
            strokeWidth={0}
            fill="url(#983e3e4c-de6d-4c3f-8d64-b9761d1534cc)"
          />
        </svg>
        
        {/* Main Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-3 md:px-6 pt-16 lg:pt-24">
          <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            
            {/* Left Column - Text Content */}
            <div className="space-y-6 lg:col-span-2">
              <h1 className="text-sm text-gray-700 dark:text-gray-300 group font-inter px-5 py-2 bg-gradient-to-tr from-white/90 via-blue-50/90 to-indigo-50/80 dark:from-slate-800/90 dark:via-slate-700/90 dark:to-slate-800/80 border-[2px] border-gray-300/60 dark:border-gray-600/60 rounded-3xl w-fit backdrop-blur-sm shadow-lg">
                <pre className="tracking-tight uppercase">
                  AI-Powered Supply Chain Intelligence
                  <ChevronRight className="inline w-4 h-4 ml-2 group-hover:translate-x-1 duration-300" />
                </pre>
              </h1>
              
              <HeroAnimated
                header="Transform Your Supply Chain with Intelligent Resilience"
                headerClassName="text-left tracking-tight text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold font-inter text-transparent bg-clip-text bg-gradient-to-r from-gray-800 via-blue-700 to-indigo-700 dark:from-white dark:via-blue-300 dark:to-indigo-300 leading-tight drop-shadow-sm"
                description=""
                descriptionClassName=""
              >
                <div className="text-[0.84rem] text-gray-700 dark:text-gray-300 text-left md:text-lg max-w-xl py-4 drop-shadow-sm">
                  <pre className="tracking-tight uppercase text-wrap">
                    Build resilient supply chains with AI-driven insights, 
                    real-time monitoring, and predictive analytics that adapt to disruptions.
                  </pre>
                </div>
              </HeroAnimated>
              
              <div className="flex flex-wrap gap-4 items-start">
                <LinkItem
                  href="/dashboard"
                  className="inline-flex rounded-lg uppercase font-mono text-center group items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 transition-all duration-200 py-4 px-10 shadow-xl hover:shadow-2xl hover:scale-105"
                >
                  Start Free Trial
                  <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 duration-300" />
                </LinkItem>
                <LinkItem
                  href="/digital-twin"
                  variant="outline"
                  className="inline-flex font-mono uppercase tracking-tight rounded-lg justify-center items-center gap-x-3 border-2 border-gray-400/60 dark:border-zinc-800 hover:border-gray-500 dark:hover:border-zinc-600 bg-white/90 dark:bg-zinc-950 hover:bg-gray-50 dark:hover:text-zinc-100 text-gray-700 dark:text-white duration-200 py-4 px-10 backdrop-blur-sm shadow-lg hover:shadow-xl"
                >
                  <IconGithub className="w-5 h-5" />
                  View Demo
                </LinkItem>
              </div>
            </div>

            {/* Right Column - Video Player */}
            <div className="relative lg:pl-6 lg:col-span-3">
              <div className="relative">
                <VideoPlayer className="aspect-video w-full max-w-3xl mx-auto lg:mx-0">
                  <VideoPlayerContent
                    src="/demo-video.webm"
                    slot="media"
                    muted
                    preload="auto"
                    autoPlay
                    loop
                    crossOrigin="anonymous"
                  />
                  <VideoPlayerControlBar>
                    <VideoPlayerPlayButton />
                    <VideoPlayerSeekBackwardButton />
                    <VideoPlayerSeekForwardButton />
                    <VideoPlayerTimeRange />
                    <VideoPlayerTimeDisplay showDuration />
                    <VideoPlayerMuteButton />
                    <VideoPlayerVolumeRange />
                    <VideoPlayerFullscreenButton />
                  </VideoPlayerControlBar>
                </VideoPlayer>
                
                {/* Video Effects - Responsive to Theme */}
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-300/25 via-indigo-300/25 to-purple-300/25 dark:from-blue-500/15 dark:via-indigo-500/15 dark:to-purple-500/15 rounded-2xl blur-xl -z-10" />
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-400/10 dark:to-purple-400/10 rounded-xl blur-lg -z-10" />
                
                {/* Light mode only - subtle decorative elements */}
                <div className="absolute -top-4 -right-4 w-6 h-6 border-2 border-indigo-400/30 dark:border-indigo-400/20 rounded-full dark:opacity-0 animate-spin [animation-duration:20s]" />
                <div className="absolute -bottom-4 -left-4 w-4 h-4 bg-purple-400/40 dark:bg-purple-400/20 rounded-full dark:opacity-0 animate-bounce [animation-duration:4s] [animation-delay:1s]" />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </section>
    </>
  );
};

export default FUIHeroWithGridSimple;

