const PACKET_COUNT = 3;
const PACKET_DURATION_S = 1.8;

export type PipeState = 'working' | 'reporting' | 'asking' | 'waiting' | 'blocked' | 'idle';

type DataPipeProps = {
  path: string;
  state: PipeState;
};

/**
 * Cáp sáng giữa Sở chỉ huy và các ban: giao lệnh thì drone bay xuôi, ban gửi báo cáo
 * về thì drone bay ngược về Sở chỉ huy.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function DataPipe({ path, state }: DataPipeProps) {
  return (
    <g className={`pipe is-${state}`}>
      <path className="pipe-casing" d={path} />
      <path className="pipe-core" d={path} />
      {state === 'working' || state === 'reporting'
        ? Array.from({ length: PACKET_COUNT }, (_, index) => (
            <g key={index} className="drone">
              <path d="M -5 0 L 0 -3 L 5 0 L 0 3 Z" />
              <line x1={-7} y1={-3} x2={7} y2={3} />
              <line x1={-7} y1={3} x2={7} y2={-3} />
              <animateMotion
                rotate="auto"
                dur={`${PACKET_DURATION_S}s`}
                begin={`${(index * PACKET_DURATION_S) / PACKET_COUNT}s`}
                repeatCount="indefinite"
                path={path}
                keyPoints={state === 'reporting' ? '1;0' : '0;1'}
                keyTimes="0;1"
                calcMode="linear"
              />
            </g>
          ))
        : null}
    </g>
  );
}
