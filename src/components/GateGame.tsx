import { SkiParkMap3D } from "./SkiParkMap3D";

export function GateGame() {
  return (
    <div className="gate-game" aria-label="Freestyle park map">
      <div className="gate-game__arena">
        <SkiParkMap3D />
      </div>

      <div className="gate-game__hud">
        <h2 className="gate-game__title">Freestyle Park 3D Map Prototype</h2>
        <p className="gate-game__subtitle">
          Focus phase: park layout only. Medium jumps and rail lines, no trees or rocks.
        </p>

        <div className="gate-game__stats">
          <span>Map: v0.1</span>
          <span>Elements: Jumps + Rails</span>
          <span>Camera: Orbit</span>
        </div>
      </div>
    </div>
  );
}
