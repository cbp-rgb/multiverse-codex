import CategoryPage from './CategoryPage.jsx';

export default function Codex({ onAskJarvis }) {
  return (
    <CategoryPage
      category="monster"
      title="The Codex"
      subtitle="Canon monsters. Approved by you, out of Quarantine, ready for the table."
      onAskJarvis={onAskJarvis}
    />
  );
}
