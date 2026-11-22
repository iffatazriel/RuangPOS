import { APP_VERSION, DONATION_URL, REPOSITORY_URL } from "../lib/config";

export function About() {
  return <section className="panel about-card">
    <h2>Tentang RuangPOS</h2>
    <p className="notice">Kasir gratis, terbuka, dan lokal untuk UMKM Indonesia. Versi {APP_VERSION}.</p>
    <div className="about-links">
      <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">Kode sumber di GitHub</a>
      <a href={`${REPOSITORY_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">Lisensi AGPL-3.0</a>
      <a className="donation-link" href={DONATION_URL} target="_blank" rel="noopener noreferrer">Dukung RuangPOS</a>
    </div>
  </section>;
}
