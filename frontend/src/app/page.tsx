import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-2xl font-bold text-mairia-blue">MairIA</span>
        <Link
          href="/admin/login"
          className="text-sm font-medium text-mairia-blue hover:underline"
        >
          Connexion
        </Link>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          L&apos;assistant IA pour les
          <span className="text-mairia-blue"> mairies francaises</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Integrez un chatbot intelligent sur le site de votre mairie en 10
          minutes. Vos citoyens obtiennent des reponses instantanees, basees
          uniquement sur vos documents officiels.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link
            href="/admin/login"
            className="px-6 py-3 bg-mairia-blue text-white font-medium rounded-lg hover:bg-blue-800 transition"
          >
            Acceder au back-office
          </Link>
          <a
            href="#fonctionnement"
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Comment ca marche
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Pourquoi MairIA ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Integration en 1 ligne",
                desc: "Copiez-collez une ligne de code sur votre site. Le chatbot apparait immediatement, aux couleurs de votre mairie.",
                icon: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4",
              },
              {
                title: "100% souverain",
                desc: "Toute la stack est europeenne. Vos donnees restent en France et en Allemagne. Conforme RGPD by design.",
                icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9",
              },
              {
                title: "Zero hallucination",
                desc: "Le chatbot repond uniquement a partir de vos documents. S'il ne sait pas, il invite a contacter la mairie.",
                icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white rounded-xl border border-gray-200 p-6"
              >
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-5 h-5 text-mairia-blue"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={feature.icon}
                    />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="fonctionnement" className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Comment ca marche
          </h2>
          <div className="space-y-8">
            {[
              {
                step: "1",
                title: "Uploadez vos documents",
                desc: "PDF, Word ou pages web : horaires, deliberations, menus de cantine, infos urbanisme... Le systeme indexe tout automatiquement.",
              },
              {
                step: "2",
                title: "Integrez le widget",
                desc: "Copiez une ligne de <script> sur votre site. Le chatbot apparait en bas a droite, aux couleurs de votre mairie.",
              },
              {
                step: "3",
                title: "Vos citoyens posent leurs questions",
                desc: "L'IA cherche la reponse dans vos documents et repond instantanement. Si l'info n'existe pas, elle oriente vers la mairie.",
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-6 items-start">
                <div className="w-10 h-10 bg-mairia-blue text-white rounded-full flex items-center justify-center font-bold text-lg shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration code */}
      <section className="bg-gray-900 py-16">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            1 ligne de code, c&apos;est tout.
          </h2>
          <div className="bg-gray-800 rounded-xl p-6 text-left">
            <code className="text-green-400 text-sm">
              &lt;script src=&quot;https://app.mairia.fr/embed.js&quot;
              <br />
              {"        "}data-tenant-id=&quot;votre-id&quot;
              <br />
              {"        "}data-color=&quot;#0055A4&quot;&gt;&lt;/script&gt;
            </code>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-500">
        <p>MairIA — Concu en France, heberge en Europe.</p>
      </footer>
    </main>
  );
}
