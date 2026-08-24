import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import OverviewPage from './components/OverviewPage.jsx';
import AIChat from './components/AIChat.jsx';
import Quarantine from './components/Quarantine.jsx';
import Codex from './components/Codex.jsx';
import CategoryPage from './components/CategoryPage.jsx';
import SearchPage from './components/SearchPage.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { getQuarantineItems } from './utils/db.js';
import { supabase } from './utils/supabaseClient.js';

const CATEGORY_TABS = {
  npc: { title: 'NPCs', subtitle: 'The people of your worlds.' },
  item: { title: 'Items', subtitle: 'Artifacts, relics, and gear.' },
  spell: { title: 'Spells', subtitle: 'Magic, canon and homebrew.' },
  location: { title: 'Locations', subtitle: 'Places across the multiverse.' },
  faction: { title: 'Factions', subtitle: 'Organizations and allegiances.' },
  mechanic: { title: 'Mechanics', subtitle: 'Homebrew rules and systems.' },
  lore: { title: 'Lore', subtitle: 'World history, cosmology, and the truths behind the truths.' },
  session: { title: 'Sessions', subtitle: 'What happened, and what it opened up.' },
  table: { title: 'Tables', subtitle: 'Random tables to roll on — loot, encounters, rumors, quirks, whatever the moment calls for.' },
};

export default function App() {
  const [tab, setTab] = useState('overview');
  const [quarantineCount, setQuarantineCount] = useState(0);
  const [jarvisSeed, setJarvisSeed] = useState(null);

  const refreshCount = useCallback(() => {
    getQuarantineItems().then((items) => setQuarantineCount(items.length));
  }, []);

  useEffect(() => {
    refreshCount();
  }, [refreshCount]);

  return (
    <div className="min-h-screen bg-parchment text-ink font-body">
      <Header active={tab} onChange={setTab} quarantineCount={quarantineCount} onSignOut={() => supabase?.auth.signOut()} />
      <ErrorBoundary key={tab}>
        {tab === 'overview' && <OverviewPage />}
        {tab === 'search' && <SearchPage onAskJarvis={setJarvisSeed} />}
        {tab === 'quarantine' && <Quarantine onChange={refreshCount} onAskJarvis={setJarvisSeed} />}
        {tab === 'codex' && <Codex onAskJarvis={setJarvisSeed} />}
        {CATEGORY_TABS[tab] && (
          <CategoryPage category={tab} title={CATEGORY_TABS[tab].title} subtitle={CATEGORY_TABS[tab].subtitle} onAskJarvis={setJarvisSeed} />
        )}
      </ErrorBoundary>
      <AIChat onSentToQuarantine={refreshCount} seed={jarvisSeed} onSeedHandled={() => setJarvisSeed(null)} />
    </div>
  );
}
