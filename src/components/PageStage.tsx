import { ReactNode } from 'react';

export default function PageStage({ loading, view, children }: { loading: boolean; view: string; children: ReactNode }) {
  return <div className="page-stage" aria-busy={loading}>
    {loading ? <div className="page-loading" role="status"><span className="page-loading-ring" aria-hidden="true" /><p>Abrindo página...</p></div>
      : <div key={view} className="page-transition">{children}</div>}
  </div>;
}
