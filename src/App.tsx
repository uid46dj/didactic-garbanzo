import { GameProvider, useGame } from "./context/GameContext";
import { CameraStreamsProvider } from "./context/CameraStreamsContext";
import ConsentScreen from "./components/ConsentScreen";
import CameraSetup from "./components/CameraSetup";
import Calibration from "./components/Calibration";
import Dashboard from "./components/Dashboard";
import FinalResults from "./components/FinalResults";

function Screens() {
  const { state } = useGame();
  switch (state.step) {
    case "consent":
      return <ConsentScreen />;
    case "camera-setup":
      return <CameraSetup />;
    case "calibration":
      return <Calibration />;
    case "dashboard":
      return <Dashboard />;
    case "final":
      return <FinalResults />;
    default:
      return <ConsentScreen />;
  }
}

export default function App() {
  return (
    <GameProvider>
      <CameraStreamsProvider>
        <div className="min-h-screen bg-slate-950 bg-[radial-gradient(circle_at_top,#1e1b4b,transparent_60%)] text-slate-100">
          <Screens />
        </div>
      </CameraStreamsProvider>
    </GameProvider>
  );
}
