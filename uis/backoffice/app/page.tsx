import Link from "next/link";

const tools = [
  { href: "/incidents", title: "Incident Manager", description: "Create, triage, filter, and manage Brasaland operational incidents." },
  { href: "/talent-pipeline", title: "Talent Pipeline", description: "Track candidate records, stages, statuses, notes, and follow-ups." }
];

export default function BackofficeHomePage() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <div><p className="eyebrow">Brasaland internal tools</p><h1>Backoffice</h1><p className="muted">A centralized workspace for operational and talent workflows.</p></div>
      </header>
      <section className="card-grid" aria-label="Backoffice tools">
        {tools.map((tool) => <Link className="card tool-card" href={tool.href} key={tool.href}><h2>{tool.title}</h2><p className="muted">{tool.description}</p><span className="card-action">Open tool →</span></Link>)}
      </section>
    </main>
  );
}