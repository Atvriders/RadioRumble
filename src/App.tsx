import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Layout/Header';
import Nav from './components/Layout/Nav';
// import { useWebSocket } from './hooks/useWebSocket';
// import { useContestStore } from './stores/useContestStore';

// Page placeholders until real pages are built
function Scoreboard() {
  return <div style={{ padding: 24 }}>Scoreboard</div>;
}
function QsoMap() {
  return <div style={{ padding: 24 }}>QSO Map</div>;
}
function Stats() {
  return <div style={{ padding: 24 }}>Stats</div>;
}
function ContestManager() {
  return <div style={{ padding: 24 }}>Contest Manager</div>;
}

export default function App() {
  // const { activeContest } = useContestStore();
  // useWebSocket(activeContest?.id ?? null);

  return (
    <BrowserRouter>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Header />
        <Nav />
        <main style={{ flex: 1, overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Scoreboard />} />
            <Route path="/map" element={<QsoMap />} />
            <Route path="/stats" element={<Stats />} />
            <Route path="/manage" element={<ContestManager />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
