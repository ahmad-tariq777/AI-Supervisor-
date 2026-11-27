import { STAGES, STAGE_KEYS } from '../constants.js';

export function stageState(stage, index) {
  const currentIndex = STAGE_KEYS.indexOf(stage);
  if (index < currentIndex) return 'done';
  if (index === currentIndex) return 'current';
  return 'upcoming';
}

export default function StageTracker({ stage }) {
  return (
    <ol className="stage-tracker" aria-label="Project lifecycle">
      {STAGES.map((item, index) => {
        const state = stageState(stage, index);
        return (
          <li
            key={item.key}
            className={`stage-step stage-${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="stage-marker" aria-hidden="true">
              {state === 'done' ? '\u2713' : index + 1}
            </span>
            <span className="stage-label">{item.key}</span>
            <span className="visually-hidden">
              {state === 'done' ? ' (done)' : state === 'current' ? ' (current)' : ' (upcoming)'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
