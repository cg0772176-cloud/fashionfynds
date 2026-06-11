import WaitlistForm from "@/components/WaitlistForm";
import Link from "next/link";

export default function EditorialWaitlistPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 flex flex-col lg:flex-row overflow-hidden"
      style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
    >
      
      {/* LEFT SIDE: The Velvet Rope */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-8 md:p-16 lg:p-20 xl:p-24 z-10 bg-[#FAFAFA] relative min-h-[70vh] lg:min-h-screen">
        
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="text-xl md:text-2xl tracking-[0.25em] uppercase font-bold text-zinc-900"
            style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
          >
            FashionFynds
          </div>
          <div className="hidden sm:block px-3 py-1 border border-zinc-200 text-[9px] uppercase tracking-[0.2em] font-semibold text-zinc-400 bg-white">
            Private Beta
          </div>
        </header>

        {/* Hero Content */}
        <main className="mt-16 lg:mt-0">
          <div>
            <div className="inline-block mb-8 px-4 py-1.5 border border-zinc-200 text-[10px] uppercase tracking-[0.2em] font-semibold text-zinc-500 bg-white">
              Invite-Only Marketplace
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight text-zinc-900 mb-8"
              style={{ fontFamily: "'Playfair Display', 'Georgia', serif" }}
            >
              The Future of <br />
              <span className="italic text-zinc-400 font-light">Fashion</span> is <br />
              Exclusive.
            </h1>
            
            <p className="text-base sm:text-lg text-zinc-500 mb-10 max-w-md leading-relaxed font-light">
              Discover curated independent brands and limited-run pieces. We are currently in private beta. Join the waitlist to secure your early-access invitation.
            </p>

            {/* Waitlist Form */}
            <WaitlistForm />

            {/* Social Proof */}
            <div className="flex items-center gap-3 mt-8">
              <div className="flex -space-x-2">
                {[
                  "bg-zinc-800",
                  "bg-zinc-600",
                  "bg-zinc-400",
                  "bg-zinc-300",
                ].map((bg, i) => (
                  <div key={i} className={`w-7 h-7 rounded-full ${bg} border-2 border-[#FAFAFA] flex items-center justify-center`}>
                    <span className="text-white text-[9px] font-bold">
                      {["A", "S", "R", "M"][i]}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Join <span className="text-zinc-600 font-semibold">4,200+</span> fashion-forward individuals
              </p>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 lg:mt-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
            <div className="text-[10px] text-zinc-400 font-semibold tracking-[0.15em] uppercase flex flex-wrap gap-x-6 gap-y-2">
              <span>© {new Date().getFullYear()} FashionFynds</span>
              <Link href="/privacy" className="hover:text-zinc-600 transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-zinc-600 transition-colors">Terms</Link>
            </div>
            <div className="flex gap-4">
              <a href="https://instagram.com/fashionfynds" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-zinc-300 hover:text-zinc-600 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a href="https://twitter.com/fashionfynds" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-zinc-300 hover:text-zinc-600 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* RIGHT SIDE: The Teaser (Static Editorial Collage) */}
      <div className="w-full lg:w-1/2 h-[50vh] lg:h-screen bg-zinc-100 overflow-hidden relative flex items-center justify-center p-6 lg:p-12">
        
        <div className="relative w-full max-w-xl aspect-[4/5] lg:aspect-square">
          {/* Main Large Image */}
          <div className="absolute top-0 right-0 w-[72%] h-[82%] shadow-2xl z-20 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80" 
              alt="High fashion editorial — curated independent designer collection" 
              className="w-full h-full object-cover grayscale-[20%]"
              loading="eager"
            />
          </div>
          
          {/* Overlapping image bottom left */}
          <div className="absolute bottom-0 left-0 w-[48%] h-[52%] shadow-2xl z-30 border-[6px] border-[#FAFAFA] overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" 
              alt="Streetwear editorial — limited-run fashion pieces"
              className="w-full h-full object-cover"
              loading="eager"
            />
          </div>

          {/* Small overlapping image top left */}
          <div className="absolute top-[8%] left-[8%] w-[36%] h-[38%] shadow-xl z-10 overflow-hidden">
            <img 
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80" 
              alt="Fashion craftsmanship — fabric and textile detail" 
              className="w-full h-full object-cover grayscale"
              loading="eager"
            />
          </div>

          {/* Decorative accent line */}
          <div className="hidden lg:block absolute -right-6 top-[15%] w-px h-[70%] bg-gradient-to-b from-transparent via-zinc-300 to-transparent z-0" />
        </div>
      </div>

      {/* Google Fonts */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link 
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap" 
        rel="stylesheet" 
      />
    </div>
  );
}
