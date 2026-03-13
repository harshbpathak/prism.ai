"use client"

import Link from "next/link"
import { ShieldAlert } from "lucide-react"

export function Footer() {
  return (
    <footer className="w-full bg-black py-12">
      <div className="max-w-[1400px] mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] md:pr-16">
          {/* Brand and Copyright */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl blur-sm"></div>
                <div className="relative bg-gradient-to-br from-primary to-primary/80 p-2 rounded-xl shadow-lg">
                  <ShieldAlert className="h-5 w-5 text-primary-foreground" />
                </div>
              </div>
              <h2 className="text-2xl font-medium text-white">PRISM</h2>
            </div>
            <p className="text-sm text-gray-500">© copyright PRISM 2025. All rights reserved.</p>
          </div>

          <div className="flex gap-32 md:ml-auto">
            {/* Socials */}
            <div>
              <h3 className="text-base font-medium text-white mb-6">Socials</h3>
              <ul className="space-y-4">
                <li><a href="#" className="text-base text-gray-500 hover:text-white transition-colors">Facebook</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-white transition-colors">Instagram</a></li>
                <li><a href="#" className="text-base text-gray-500 hover:text-white transition-colors">LinkedIn</a></li>
              </ul>
            </div>

            {/* Pages */}
            <div>
              <h3 className="text-base font-medium text-white mb-6">Pages</h3>
              <ul className="space-y-4">
                <li><a href="#top" className="text-base text-gray-500 hover:text-white transition-colors">Home</a></li>
                <li><a href="#features" className="text-base text-gray-500 hover:text-white transition-colors">Features</a></li>
                <li><a href="#benefits" className="text-base text-gray-500 hover:text-white transition-colors">Benefits</a></li>
                <li><a href="#contact" className="text-base text-gray-500 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Brand Text */}
        <div className="mt-32 text-center">
          <p className="text-[60px] font-bold bg-gradient-to-b from-[#1A1A1A] via-[#4A4A4A] to-white bg-clip-text text-transparent uppercase tracking-wider">PRISM</p>
          <p className="text-sm text-gray-500 mt-4">Developed by <span className="text-white">Team Innovisonaries</span></p>
        </div>
      </div>
    </footer>
  )
}