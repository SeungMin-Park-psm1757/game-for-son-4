import { FSM } from './fsm';
import { CanvasRenderer } from './canvas';
import { UIManager } from './ui';

export class GameLoop {
    private tickCount: number = 0;
    private reqId: number = 0;

    constructor(
        private fsm: FSM,
        private renderer: CanvasRenderer,
        private ui: UIManager
    ) { }

    public start() {
        const loop = () => {
            this.tickCount++;

            this.fsm.update();
            this.ui.update();
            this.renderer.render(this.fsm.currentState, this.tickCount);

            this.reqId = requestAnimationFrame(loop);
        };
        this.reqId = requestAnimationFrame(loop);
    }

    public stop() {
        cancelAnimationFrame(this.reqId);
    }
}
