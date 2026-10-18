import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Lock, FileText, Mail } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-border bg-surface text-text transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-white font-bold text-xs">
                <span>U</span>
              </div>
              <span className="font-bold text-base tracking-tight font-serif">UNFAZED</span>
            </div>
            <p className="text-xs text-text-muted leading-relaxed">
              The purpose-built practice operating system for mental health professionals and private therapy practices in India.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-text-muted pt-2">
              <Shield className="w-3.5 h-3.5 text-primary" />
              <span>Engineered for Clinical Privacy</span>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-text uppercase tracking-wider">Product</h5>
            <ul className="space-y-1.5 text-xs text-text-muted">
              <li><a href="#features" className="hover:text-text">Branded Practice Link</a></li>
              <li><a href="#features" className="hover:text-text">Intelligent Scheduling</a></li>
              <li><a href="#features" className="hover:text-text">Client CRM & Leads</a></li>
              <li><a href="#features" className="hover:text-text">Clinical SOAP/DAP Notes</a></li>
              <li><a href="#pricing" className="hover:text-text">Practice Tiers</a></li>
            </ul>
          </div>

          {/* Quick Demo & Access */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-text uppercase tracking-wider">Demo & Access</h5>
            <ul className="space-y-1.5 text-xs text-text-muted">
              <li><Link to="/dr-sharma" className="hover:text-text font-medium text-primary">Live Branded Profile (/dr-sharma)</Link></li>
              <li><Link to="/login" className="hover:text-text">Therapist Login</Link></li>
              <li><Link to="/login" className="hover:text-text">Client Portal Sign In</Link></li>
              <li><Link to="/register" className="hover:text-text">Create Free Practice</Link></li>
            </ul>
          </div>

          {/* Security & Standards */}
          <div className="space-y-2">
            <h5 className="text-xs font-semibold text-text uppercase tracking-wider">Security & Compliance</h5>
            <p className="text-xs text-text-muted leading-relaxed">
              Designed with strict tenant isolation, multi-level private clinical note safeguarding, and auditable informed consent for mental health practices in India.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-text-muted pt-1">
              <Lock className="w-3.5 h-3.5 text-success" />
              <span>End-to-End Session Authorization</span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} UNFAZED Technologies. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>GST-Compliant Invoicing</span>
            <span>Made for Therapists in India</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
