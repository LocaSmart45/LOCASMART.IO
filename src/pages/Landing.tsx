import React, { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Building2,
  Calendar,
  CreditCard,
  CheckCircle2,
  Key,
  Menu,
  ShieldCheck,
  Users,
  X,
  Home,
  LineChart,
  Wallet,
  Star,
  Smartphone
} from 'lucide-react';

const APP_URL = 'https://app.locasmart.net';

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-blue-100">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <a href="#top" className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/30">
                <Key className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-extrabold tracking-tight">LocaSmart</span>
                <span className="text-xs uppercase tracking-[.2em] text-slate-400">
                  Conciergerie &amp; Logiciel
                </span>
              </div>
            </a>

            {/* Desktop menu */}
            <div className="hidden md:flex items-center gap-8 text-sm font-medium">
              <a href="#solution" className="text-slate-600 hover:text-blue-600">
                Le logiciel
              </a>
              <a href="#gestion" className="text-slate-600 hover:text-blue-600">
                Pour les propriétaires
              </a>
              <a href="#tarifs" className="text-slate-600 hover:text-blue-600">
                Tarifs
              </a>
              <a href="#faq" className="text-slate-600 hover:text-blue-600">
                FAQ
              </a>

              <a
                href={APP_URL}
                className="text-slate-700 hover:text-blue-600 font-semibold"
              >
                Connexion
              </a>
              <a
                href={`${APP_URL}/signup`}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
              >
                Essai gratuit 14 jours
              </a>
            </div>

            {/* Mobile button */}
            <button
              className="md:hidden p-2 text-slate-600"
              onClick={() => setIsMenuOpen((v) => !v)}
              aria-label="Ouvrir le menu"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white shadow-lg">
            <div className="px-4 py-4 space-y-3 text-sm font-medium">
              <a
                href="#solution"
                className="block py-2 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Le logiciel
              </a>
              <a
                href="#gestion"
                className="block py-2 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Pour les propriétaires
              </a>
              <a
                href="#tarifs"
                className="block py-2 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Tarifs
              </a>
              <a
                href="#faq"
                className="block py-2 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                FAQ
              </a>

              <a
                href={APP_URL}
                className="mt-3 block w-full text-center border border-slate-200 rounded-xl py-2.5 text-slate-700"
                onClick={() => setIsMenuOpen(false)}
              >
                Connexion
              </a>
              <a
                href={`${APP_URL}/signup`}
                className="block w-full text-center bg-blue-600 text-white rounded-xl py-2.5 font-semibold mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Essai gratuit 14 jours
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <main id="top">
        <section className="relative overflow-hidden bg-slate-50 pt-16 pb-24 md:pb-28">
          {/* Background blobs */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -right-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-10 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
          </div>

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-12 items-center">
              {/* Left: copy */}
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-semibold text-blue-700 shadow-sm mb-5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[10px] text-white">
                    NEW
                  </span>
                  <span>Logiciel pour conciergeries + gestion clé en main propriétaires</span>
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.05] mb-6">
                  La solution tout-en-un pour
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500">
                    conciergeries &amp; propriétaires.
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-slate-600 leading-relaxed mb-8 max-w-xl">
                  LocaSmart automatise vos locations courte durée : calendrier, facturation,
                  propriétaires, voyageurs… Que vous gériez une conciergerie ou un seul appartement,
                  tout est centralisé au même endroit.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                  <a
                    href="#offre-b2b"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3 text-sm md:text-base font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
                  >
                    Je suis une conciergerie
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#offre-b2c"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-7 py-3 text-sm md:text-base font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Je suis propriétaire
                    <Home className="h-4 w-4" />
                  </a>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <span>Service basé en France</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-blue-500" />
                    <span>Essai gratuit, sans CB</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span>Pensé par des gestionnaires</span>
                  </div>
                </div>
              </div>

              {/* Right: CSS dashboard mockup */}
              <div className="relative">
                <div className="absolute -inset-3 rounded-[32px] bg-gradient-to-tr from-blue-500/40 via-indigo-500/30 to-emerald-400/40 blur-xl opacity-60" />
                <div className="relative rounded-3xl bg-white p-3 shadow-2xl ring-1 ring-slate-900/5">
                  <div className="rounded-2xl bg-slate-950 text-slate-50 px-4 py-3 flex items-center justify-between text-xs mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex -space-x-1">
                        <span className="h-5 w-5 rounded-full bg-emerald-500/90 border border-slate-900" />
                        <span className="h-5 w-5 rounded-full bg-blue-500/90 border border-slate-900" />
                      </div>
                      <span className="font-semibold">Tableau de bord LocaSmart</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Synchro OTA active
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-2xl overflow-hidden border border-slate-100">
                    <div className="flex">
                      {/* Sidebar */}
                      <div className="hidden md:flex md:flex-col w-40 bg-slate-900/95 text-slate-100 p-3 gap-2 text-[11px]">
                        <div className="h-7 w-24 rounded-md bg-slate-700 mb-3" />
                        <div className="flex items-center gap-2 rounded-lg bg-blue-600/20 px-2 py-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Calendrier</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-2 py-1.5">
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Biens</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-2 py-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>Propriétaires</span>
                        </div>
                        <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-2 py-1.5">
                          <CreditCard className="h-3.5 w-3.5" />
                          <span>Factures</span>
                        </div>
                      </div>

                      {/* Main panel */}
                      <div className="flex-1 p-4 space-y-4">
                        {/* Top row */}
                        <div className="flex items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="h-3 w-24 rounded bg-slate-200" />
                            <div className="h-4 w-40 rounded bg-slate-100" />
                          </div>
                          <div className="flex gap-2">
                            <div className="h-8 w-20 rounded-full bg-slate-200" />
                            <div className="h-8 w-8 rounded-full bg-slate-200" />
                          </div>
                        </div>

                        {/* Stats cards */}
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Calendar className="h-3.5 w-3.5 text-emerald-500" />
                              </div>
                              <span className="h-3 w-12 rounded bg-slate-100" />
                            </div>
                            <div className="h-5 w-10 rounded bg-slate-200" />
                            <div className="h-2 w-full rounded bg-emerald-100" />
                          </div>
                          <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-blue-50 flex items-center justify-center">
                                <LineChart className="h-3.5 w-3.5 text-blue-500" />
                              </div>
                              <span className="h-3 w-12 rounded bg-slate-100" />
                            </div>
                            <div className="h-5 w-10 rounded bg-slate-200" />
                            <div className="h-2 w-full rounded bg-blue-100" />
                          </div>
                          <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-lg bg-amber-50 flex items-center justify-center">
                                <Wallet className="h-3.5 w-3.5 text-amber-500" />
                              </div>
                              <span className="h-3 w-12 rounded bg-slate-100" />
                            </div>
                            <div className="h-5 w-10 rounded bg-slate-200" />
                            <div className="h-2 w-full rounded bg-amber-100" />
                          </div>
                        </div>

                        {/* Calendar / table */}
                        <div className="rounded-xl bg-white p-3 shadow-sm border border-slate-100 space-y-2">
                          <div className="flex items-center justify-between mb-1">
                            <div className="h-4 w-24 rounded bg-slate-100" />
                            <div className="flex gap-2">
                              <div className="h-6 w-16 rounded-full bg-slate-100" />
                              <div className="h-6 w-6 rounded-full bg-slate-100" />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="h-2 w-full rounded bg-slate-50" />
                            <div className="h-2 w-full rounded bg-slate-50" />
                            <div className="h-2 w-3/4 rounded bg-slate-50" />
                            <div className="h-2 w-2/3 rounded bg-slate-50" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom strip: OTA logos */}
                  <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Interface responsive pour suivre vos réservations partout.</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 opacity-70">
                      <span className="text-xs font-semibold tracking-wide uppercase">Compatible</span>
                      <span className="text-xs font-black text-[#FF5A5F] leading-none">
                        airbnb
                      </span>
                      <span className="text-xs font-black text-[#003580] leading-none">
                        Booking.com
                      </span>
                      <span className="text-xs font-black text-[#004F9F] leading-none">
                        Expedia
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION LOGICIEL (B2B) */}
        <section
          id="solution"
          className="py-20 bg-white border-t border-slate-100"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-12">
              <div>
                <p className="text-xs font-semibold tracking-[.25em] uppercase text-blue-600 mb-3">
                  POUR LES CONCIERGERIES &amp; GESTIONNAIRES
                </p>
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                  Un logiciel pensé pour scaler votre conciergerie.
                </h2>
                <p className="text-slate-600 max-w-xl">
                  Gagnez des heures chaque semaine : synchronisation de vos calendriers,
                  factures automatiques, portail propriétaires et suivi des revenus en temps réel.
                </p>
              </div>
              <a
                href={`${APP_URL}/signup`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-black transition-colors"
              >
                Tester le logiciel gratuitement
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <FeatureCard
                icon={<Calendar className="h-5 w-5 text-blue-600" />}
                title="Calendrier unifié"
                desc="Toutes vos réservations en un seul endroit, avec synchronisation iCal pour éviter les doubles-bookings."
              />
              <FeatureCard
                icon={<BarChart3 className="h-5 w-5 text-indigo-600" />}
                title="Compta &amp; commissions"
                desc="Commissions calculées automatiquement, exports comptables et factures générées en quelques clics."
              />
              <FeatureCard
                icon={<Users className="h-5 w-5 text-emerald-600" />}
                title="Portail propriétaires"
                desc="Un accès dédié à vos propriétaires pour qu'ils consultent revenus, réservations et factures en autonomie."
              />
            </div>
          </div>
        </section>

        {/* SECTION GESTION COMPLETE (B2C) */}
        <section
          id="gestion"
          className="py-20 bg-slate-900 text-slate-50 relative overflow-hidden"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 right-0 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-12 items-start">
              <div>
                <p className="text-xs font-semibold tracking-[.25em] uppercase text-emerald-400 mb-3">
                  POUR LES PROPRIÉTAIRES
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Vous confiez, on gère tout.
                </h2>
                <p className="text-slate-200 mb-6 max-w-xl">
                  Vous possédez un appartement ou une maison en location courte durée ? Nous
                  gérons à votre place : annonces, voyageurs, ménage, linge, optimisation des
                  prix… Vous suivez simplement vos revenus depuis votre espace propriétaire.
                </p>

                <div className="grid sm:grid-cols-2 gap-4 mb-8">
                  <B2cBullet title="Création & optimisation d’annonce" />
                  <B2cBullet title="Gestion des voyageurs 7j/7" />
                  <B2cBullet title="Ménage & blanchisserie inclus" />
                  <B2cBullet title="Optimisation des revenus" />
                  <B2cBullet title="Accès à l’espace propriétaire" />
                  <B2cBullet title="Reporting clair chaque mois" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                  <a
                    href="mailto:infos@locasmart.net?subject=Confier%20mon%20logement%20%C3%A0%20LocaSmart"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3 text-sm md:text-base font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
                  >
                    Confier mon logement
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <p className="text-xs text-slate-400">
                    Devis gratuit • Rémunération uniquement à la performance
                  </p>
                </div>
              </div>

              {/* Steps */}
              <div
                id="offre-b2c"
                className="bg-slate-950/40 border border-slate-800 rounded-3xl p-6 md:p-7 shadow-2xl backdrop-blur-sm"
              >
                <p className="text-xs font-semibold tracking-[.25em] uppercase text-slate-400 mb-3">
                  COMMENT ÇA MARCHE ?
                </p>
                <ol className="space-y-5 text-sm">
                  <li className="flex gap-3">
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-slate-900">
                      1
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Audit gratuit de votre bien</p>
                      <p className="text-slate-300">
                        On estime ensemble le potentiel de votre logement en location courte durée :
                        revenus, taux d’occupation, positionnement.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-slate-900">
                      2
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Mise en place opérationnelle</p>
                      <p className="text-slate-300">
                        Création ou refonte de votre annonce, shooting photo si besoin, paramétrage
                        des prix et du calendrier, mise en place du ménage.
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-slate-900">
                      3
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Gestion au quotidien</p>
                      <p className="text-slate-300">
                        Nous gérons les voyageurs, le ménage, les encaissements et vous reverseons
                        vos revenus, avec un reporting détaillé dans l’espace propriétaire.
                      </p>
                    </div>
                  </li>
                </ol>

                <div className="mt-6 rounded-2xl bg-slate-900/60 border border-slate-700 p-4 flex items-start gap-3 text-xs text-slate-300">
                  <ShieldCheck className="h-4 w-4 text-emerald-400 mt-0.5" />
                  <p>
                    Contrat clair, sans surprise. Vous restez propriétaire de votre bien et gardez
                    la main sur les périodes de blocage pour votre usage personnel.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TARIFS */}
        <section
          id="tarifs"
          className="py-20 bg-slate-50 border-t border-slate-200"
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold tracking-[.25em] uppercase text-blue-600 mb-3">
                TARIFS TRANSPARENTS
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Deux façons de travailler ensemble.
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Choisissez la formule qui correspond à votre réalité : logiciel pour conciergeries
                ou gestion complète si vous ne voulez plus vous occuper de rien.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-7 max-w-4xl mx-auto">
              {/* SaaS B2B */}
              <div
                id="offre-b2b"
                className="relative flex flex-col rounded-3xl bg-white border border-slate-200 shadow-sm p-7"
              >
                <div className="absolute top-0 left-0 rounded-br-2xl bg-blue-600 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                  POUR LES CONCIERGERIES
                </div>
                <h3 className="mt-6 text-xl font-bold text-slate-900 mb-1">
                  Logiciel LocaSmart
                </h3>
                <p className="text-sm text-slate-500 mb-5">
                  Idéal pour les conciergeries et gestionnaires qui veulent structurer et automatiser
                  leur activité.
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">29,99€</span>
                  <span className="text-sm text-slate-500">/ mois</span>
                </div>

                <ul className="space-y-3 text-sm mb-6 flex-1">
                  <PricingItem text="Nombre de biens illimité" />
                  <PricingItem text="Synchronisation iCal (Airbnb, Booking, etc.)" />
                  <PricingItem text="Portail propriétaires inclus" />
                  <PricingItem text="Factures & commissions automatiques" />
                  <PricingItem text="Accès multi-utilisateurs" />
                </ul>

                <a
                  href={`${APP_URL}/signup`}
                  className="inline-flex items-center justify-center w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 transition-colors"
                >
                  Essai gratuit 14 jours
                </a>
                <p className="mt-2 text-[11px] text-slate-400 text-center">
                  Sans engagement • Annulation en un clic
                </p>
              </div>

              {/* Gestion complète B2C */}
              <div className="relative flex flex-col rounded-3xl bg-slate-900 text-slate-50 border border-slate-800 shadow-xl p-7">
                <div className="absolute top-0 right-0 rounded-bl-2xl bg-emerald-500 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-900">
                  POUR LES PROPRIÉTAIRES
                </div>
                <h3 className="mt-6 text-xl font-bold mb-1">Gestion complète</h3>
                <p className="text-sm text-slate-300 mb-5">
                  Vous déléguez tout : nous gérons votre bien comme une conciergerie professionnelle,
                  en optimisant vos revenus.
                </p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">14%</span>
                  <span className="text-sm text-slate-300">des revenus locatifs</span>
                </div>

                <ul className="space-y-3 text-sm mb-6 flex-1">
                  <PricingItem text="Aucun frais fixe, rémunération au résultat" inverted />
                  <PricingItem text="Création & optimisation d’annonce" inverted />
                  <PricingItem text="Gestion des voyageurs, ménage & linge" inverted />
                  <PricingItem text="Accès temps réel à vos revenus" inverted />
                  <PricingItem text="Conseils fiscaux d’orientation (non contractuels)" inverted />
                </ul>

                <a
                  href="mailto:infos@locasmart.net?subject=Demande%20d%27information%20-%20Gestion%20compl%C3%A8te"
                  className="inline-flex items-center justify-center w-full rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-emerald-500/30 hover:bg-emerald-400 transition-colors"
                >
                  Demander une étude gratuite
                </a>
                <p className="mt-2 text-[11px] text-slate-400 text-center">
                  Paiement uniquement quand vous encaissez des loyers
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section
          id="faq"
          className="py-20 bg-white border-t border-slate-100"
        >
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold tracking-[.25em] uppercase text-blue-600 mb-3">
                QUESTIONS FRÉQUENTES
              </p>
              <h2 className="text-3xl font-bold text-slate-900 mb-3">
                On répond aux questions qu’on vous pose tout le temps.
              </h2>
              <p className="text-slate-600">
                Que vous soyez propriétaire ou conciergerie, voici les réponses rapides. Pour le
                reste, on échange par téléphone ou visio.
              </p>
            </div>

            <div className="space-y-5 text-sm">
              <FaqItem
                question="L’essai du logiciel est-il vraiment sans engagement ?"
                answer="Oui. Vous créez votre compte, testez LocaSmart pendant 14 jours et vous ne payez rien si vous décidez d’arrêter. Aucune carte bancaire n’est demandée à l’inscription."
              />
              <FaqItem
                question="Sur quels canaux diffusez-vous les annonces en gestion complète ?"
                answer="Nous travaillons principalement avec Airbnb, Booking.com et les principaux OTAs. L’objectif est de maximiser le taux d’occupation tout en protégeant votre bien."
              />
              <FaqItem
                question="Puis-je utiliser le logiciel si je ne gère que quelques biens ?"
                answer="Bien sûr. LocaSmart est adapté aussi bien aux conciergeries en croissance qu’aux gestionnaires qui démarrent avec 2 ou 3 biens et veulent poser de bonnes bases."
              />
              <FaqItem
                question="Comment sont calculés vos 14% de gestion ?"
                answer="Notre rémunération est calculée sur les revenus locatifs encaissés (hors dépôt de garantie et frais de ménage payés par les voyageurs). Vous avez accès au détail dans votre espace propriétaire."
              />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-400 py-10 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-blue-600 p-2 rounded-xl">
                <Key className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">LocaSmart</span>
            </div>
            <p className="text-xs max-w-sm">
              Solution française pour automatiser les conciergeries et offrir une gestion clé en
              main aux propriétaires de locations courte durée.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Contact</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a
                  href="mailto:infos@locasmart.net"
                  className="hover:text-white transition-colors"
                >
                  infos@locasmart.net
                </a>
              </li>
              <li>Paris, France</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Ressources</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  Mentions légales
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  CGV
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800 pt-4 text-[11px] text-center text-slate-500">
          © {new Date().getFullYear()} LocaSmart. Tous droits réservés.
        </div>
      </footer>
    </div>
  );
}

type PricingItemProps = {
  text: string;
  inverted?: boolean;
};

function PricingItem({ text, inverted = false }: PricingItemProps) {
  return (
    <li className="flex items-start gap-2.5">
      <div
        className={
          'mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border ' +
          (inverted
            ? 'border-emerald-400 bg-emerald-500/10 text-emerald-300'
            : 'border-blue-500 bg-blue-50 text-blue-600')
        }
      >
        <CheckCircle2 className="h-3 w-3" />
      </div>
      <span className={inverted ? 'text-slate-100' : 'text-slate-700'}>{text}</span>
    </li>
  );
}

type FeatureCardProps = {
  icon: React.ReactElement;
  title: string;
  desc: string;
};

function FeatureCard({ icon, title, desc }: FeatureCardProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-6 hover:shadow-md transition-shadow">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-900 mb-1.5">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
    </div>
  );
}

type FaqItemProps = {
  question: string;
  answer: string;
};

function FaqItem({ question, answer }: FaqItemProps) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-slate-900 mb-1.5">{question}</p>
      <p className="text-sm text-slate-600">{answer}</p>
    </div>
  );
}

type B2cBulletProps = {
  title: string;
};

function B2cBullet({ title }: B2cBulletProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-100">
      <div className="h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
        <CheckCircle2 className="h-3 w-3 text-emerald-300" />
      </div>
      <span>{title}</span>
    </div>
  );
}
