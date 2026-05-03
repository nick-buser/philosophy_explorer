import { lazy, Suspense } from 'react';
import { createLazyRoute, Link } from '@tanstack/react-router';
import { findLogicSystem } from '../data/logic-systems';

// Each lab system is its own async chunk — only loads when that system is visited.
// To add a new system: create `src/logic/labs/YourLab.tsx` (default export),
// add it here, and handle the slug in LogicSystemPage below.
const PeirceEgLab = lazy(() => import('../logic/labs/PeirceEgLab'));
const KripkeLab = lazy(() => import('../logic/labs/KripkeLab'));
const FregeBsLab = lazy(() => import('../logic/labs/FregeBsLab'));
const AristotelianLab = lazy(() => import('../logic/labs/AristotelianLab'));
const MedievalLab = lazy(() => import('../logic/labs/MedievalLab'));
const ModernFolLab = lazy(() => import('../logic/labs/ModernFolLab'));

export const Route = createLazyRoute('/logic/$system')({
  component: LogicSystemPage,
});

function LogicSystemPage() {
  const { system: slug } = Route.useParams();
  const system = findLogicSystem(slug);

  if (!system) {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <Link to="/logic" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Logic Lab
          </Link>
          <p className="text-gray-400">Unknown logic system: <code>{slug}</code>.</p>
        </div>
      </main>
    );
  }

  if (system.status === 'stub') {
    return (
      <main className="min-h-screen py-12">
        <div className="max-w-3xl mx-auto px-6 space-y-6">
          <Link to="/logic" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            ← Logic Lab
          </Link>
          <h1 className="text-3xl font-bold text-gray-100">{system.name}</h1>
          <p className="text-gray-400">{system.shortDescription}</p>
          <div className="rounded-lg border border-dashed border-gray-800 bg-gray-900/20 p-6 text-gray-400 text-sm">
            This system is a stub. Content lands in a later ticket.
          </div>
        </div>
      </main>
    );
  }

  const Lab =
    slug === 'kripke'       ? KripkeLab :
    slug === 'frege-bs'     ? FregeBsLab :
    slug === 'aristotelian' ? AristotelianLab :
    slug === 'medieval'     ? MedievalLab :
    slug === 'modern-fol'   ? ModernFolLab :
    PeirceEgLab;

  return (
    <Suspense fallback={<LabLoadingShell />}>
      <Lab system={system} />
    </Suspense>
  );
}

function LabLoadingShell() {
  return (
    <main className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-4 w-24 rounded bg-gray-800 animate-pulse" />
      </div>
    </main>
  );
}
