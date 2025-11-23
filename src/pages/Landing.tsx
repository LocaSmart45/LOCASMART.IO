import React, { useState } from 'react';
import { 
  Building2, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  Users, 
  BarChart3, 
  ArrowRight, 
  Menu,
  X
} from 'lucide-react';

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // L'adresse de ton application
  const APP_URL = "https://app.locasmart.net";

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* --- NAVIGATION --- */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">LocaSmart</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Fonctionnalités</a>
              <a href="#pricing" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Tarifs</a>
              <a href={APP_URL} className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                Se connecter
              </a>
              <a 
                href={APP_URL} 
                className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
              >
                Essai gratuit 14 jours
              </a>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-600">
                {isMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
          </div>
        </div>
        
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 p-4 space-y-4">
            <a href="#features" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Fonctionnalités</a>
            <a href="#pricing" className="block text-slate-600 font-medium" onClick={() => setIsMenuOpen(false)}>Tarifs</a>
            <a href={APP_URL} className="block text-slate-600 font-medium">Se connecter</a>
          </div>
        )}
      </nav>

      {/* --- HERO --- */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-8 border border-blue-100">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Nouveau : Synchronisation iCal automatique
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight mb-8 leading-[1.1]">
            La gestion de conciergerie <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">enfin simplifiée.</span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            Automatisez vos locations courte durée. Centralisez vos réservations, gérez vos propriétaires et générez vos factures en un clic.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <a 
              href={APP_URL} 
              className="bg-blue-600 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2"
            >
              Commencer gratuitement <ArrowRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* --- FEATURES --- */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={<Users className="h-8 w-8 text-blue-600" />}
              title="Espace Propriétaires"
              desc="Vos propriétaires accèdent à leurs calendriers et revenus via un portail dédié."
            />
            <FeatureCard 
              icon={<BarChart3 className="h-8 w-8 text-blue-600" />}
              title="Comptabilité Auto"
              desc="LocaSmart calcule vos commissions et génère les factures automatiquement."
            />
            <FeatureCard 
              icon={<Calendar className="h-8 w-8 text-blue-600" />}
              title="Calendrier Unifié"
              desc="Synchronisez Airbnb, Booking et vos réservations directes en temps réel."
            />
          </div>
        </div>
      </section>

      {/* --- PRICING --- */}
      <section id="pricing" className="py-24 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">29€ / mois</h2>
          <p className="text-slate-400 text-xl mb-8">Tout illimité. Sans engagement.</p>
          <a 
            href={APP_URL} 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-full transition-colors"
          >
            Essayer 14 jours gratuitement
          </a>
          <p className="text-slate-500 text-sm mt-4">Aucune carte bancaire requise pour l'essai.</p>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          © 2025 LocaSmart. Fait avec passion en France.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <div className="mb-6 text-blue-600">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600">{desc}</p>
    </div>
  );
}