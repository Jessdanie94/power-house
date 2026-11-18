import { useEffect, useState } from 'react';

export default function App() {
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/status', { signal: controller.signal, cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('Status unavailable');
        return response.json();
      })
      .then(data => {
        if (data.mode !== 'operator_read_only') throw new Error('Unexpected runtime');
        setStatus(data);
      })
      .catch(failure => {
        if (failure.name !== 'AbortError') setError('Local runtime status could not be read. Business readiness remains unknown.');
      });
    return () => controller.abort();
  }, []);
  return (
    <div className="operator-shell">
      <header>
        <p className="operator-label">Power House · Operator release</p>
        <h1>Read-only operations status</h1>
        <p>This is not a customer storefront. Checkout, payment capture, supplier actions, webhooks and payouts are disabled.</p>
      </header>
      <main>
        <section className="operator-notice" aria-label="Business readiness">
          <h2>Business readiness: unknown</h2>
          <p>No merchant, supplier, revenue or AI integration has been verified by this runtime. A healthy process does not mean the business is ready.</p>
        </section>
        <div className="operator-grid">
          <section className="operator-card">
            <h2>Runtime</h2>
            <p role="status">{error || (status ? 'Local process is responding. Operator-only mode confirmed.' : 'Reading local process status…')}</p>
          </section>
          <section className="operator-card">
            <h2>Revenue actuals</h2>
            <dl><dt>Gross revenue</dt><dd>Unavailable</dd><dt>Net revenue</dt><dd>Unavailable</dd><dt>Currency / observation time</dt><dd>Unknown / unavailable</dd></dl>
            <p>Missing values are null, not zero. No sample sales or balance estimates are represented as actuals.</p>
          </section>
          <section className="operator-card">
            <h2>Telemetry and AI</h2>
            <p>Order counts, inventory and supplier availability: unavailable.</p>
            <p>AI predictions: unavailable. No live model is connected.</p>
          </section>
          <section className="operator-card">
            <h2>Approval gate</h2>
            <p>Business-action requests return HTTP 503 with executed: false. Verification and explicit approval are required before any future integration.</p>
          </section>
        </div>
      </main>
      <footer>Local validation only. No claim of deployment, sales, fulfillment or financial activity.</footer>
    </div>
  );
}
