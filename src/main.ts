import './styles.css';
import { archiv } from './archiv';
import { kopie } from './modell/konfig';
import type { KuchenKonfig } from './modell/typen';
import { loadAllFonts } from './render/lettering';
import { Stage } from './render/stage';
import { kosten } from './kosten/speicher';
import { AdminSeite } from './ui/admin';
import { Panel } from './ui/panel';
import { Store } from './ui/store';

const stage = new Stage(document.getElementById('buehne')!);
const store = new Store(kopie(archiv.themen[0].konfig));
store.abonnieren((konfig) => stage.show(konfig));
stage.show(store.konfig);

const panel = new Panel(document.getElementById('panel')!, store, {
  ansichtZuruecksetzen: () => stage.resetView(),
  bildSpeichern: () => {
    const link = document.createElement('a');
    link.href = stage.snapshot();
    link.download = 'meine-torte.png';
    link.click();
  },
});

// Admin-Seite unter #admin (Zutaten, Rezepte, Preise)
const app = document.getElementById('app')!;
const adminHost = document.getElementById('admin')!;
const admin = new AdminSeite(adminHost, () => store.konfig);
function route(): void {
  const istAdmin = location.hash.startsWith('#admin');
  app.hidden = istAdmin;
  adminHost.hidden = !istAdmin;
  document.title = istAdmin ? 'Leckermailchen – Zutaten & Preise' : 'Leckermailchen – Kuchen-Konfigurator';
  if (istAdmin) admin.render();
}
window.addEventListener('hashchange', route);
route();
void kosten.laden();

// Schriften laden: danach zeigt das Bedienfeld die Schriftvorschau in der echten Schrift
void loadAllFonts().then(() => panel.render());

// Zugang für automatisierte Tests (Playwright)
Object.assign(window, {
  __kuchen: {
    archiv,
    store,
    stage,
    zeige: (k: KuchenKonfig) => store.ersetzen(k),
    thema(id: string) {
      const t = archiv.themen.find((x) => x.id === id);
      if (t) store.ersetzen(t.konfig);
    },
    ansicht: () => stage.resetView(),
    schriftenBereit: () => loadAllFonts(),
    kosten,
  },
});
