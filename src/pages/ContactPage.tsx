import React, { useState } from 'react';
import { PublicNavbar } from '../components/public/PublicNavbar';
import { PublicFooter } from '../components/public/PublicFooter';
import { Mail, Phone, MapPin, CheckCircle2, Send, ShieldCheck, AlertCircle } from 'lucide-react';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState('Senior Project Director');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#060d16] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-250">
      <PublicNavbar />

      <div className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 space-y-12">
        <div className="max-w-3xl space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Enterprise Engagement
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Deploy Structura Across Your Capital Projects.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Connect with our enterprise engineering solutions team to discuss portfolio deployment, ERP/BIM integrations, and bespoke governance configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Details Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#091422] border border-slate-200 dark:border-[#182c44] shadow-sm space-y-6 h-fit">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Enterprise Advisory</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Our engineering solutions architects support asset owners, EPC developers, and sovereign wealth infrastructure funds globally.
            </p>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                <Mail className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900 dark:text-white">Direct Advisory</span>
                  <span>enterprise@structura.build</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900 dark:text-white">Engineering HQ</span>
                  <span>450 Lexington Ave, New York, NY 10017</span>
                </div>
              </div>

              <div className="flex items-start gap-3 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block text-slate-900 dark:text-white">Compliance</span>
                  <span>ISO 19650 BIM & SOC2 Type II Certified</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact / Inquiries Form */}
          <div className="md:col-span-2 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#091422] border border-slate-200 dark:border-[#182c44] shadow-sm">
            {submitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Enterprise Briefing Request Received</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Thank you, {name}. A Structura Enterprise Engineering Director will review your project parameters and respond within one business day.
                </p>
                <div className="pt-4">
                  <button
                    onClick={() => setSubmitted(false)}
                    className="text-xs text-amber-600 dark:text-amber-400 font-bold hover:underline"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Johnathan Vance, PE"
                      className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-slate-50 dark:bg-[#0c1827] border border-slate-200 dark:border-[#1e3e62] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Corporate Email *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. j.vance@capitalpartners.com"
                      className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-slate-50 dark:bg-[#0c1827] border border-slate-200 dark:border-[#1e3e62] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Organization / Entity</label>
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      placeholder="e.g. Vance Development Group"
                      className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-slate-50 dark:bg-[#0c1827] border border-slate-200 dark:border-[#1e3e62] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Primary Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-slate-50 dark:bg-[#0c1827] border border-slate-200 dark:border-[#1e3e62] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="Owner / Client">Owner / Asset Sponsor</option>
                      <option value="Senior Project Director">Senior Project Director</option>
                      <option value="General Contractor">General Contractor / EPC</option>
                      <option value="Structural QA/QC Auditor">Structural QA/QC Auditor</option>
                      <option value="Other">Other Executive</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Project Scope & Requirements</label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe project location, estimated capital outlay, number of active phases, or key integrations required..."
                    className="w-full px-3.5 py-2.5 rounded-lg text-xs bg-slate-50 dark:bg-[#0c1827] border border-slate-200 dark:border-[#1e3e62] text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg bg-[#0B192C] text-white dark:bg-amber-500 dark:text-slate-950 hover:bg-[#122b4a] dark:hover:bg-amber-400 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Enterprise Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};
