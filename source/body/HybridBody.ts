import { RobotBody, RobotStatusLight } from "./RobotBody";

export class HybridBody implements RobotBody {
    private activeBodies: RobotBody[] = [];

    public constructor(private readonly bodies: RobotBody[]) {}

    public async init(): Promise<void>  {
        this.activeBodies = [];

        for (const body of this.bodies) {
            try {
                await body.init();
                this.activeBodies.push(body);
            } catch (error) {
                console.warn(`[HybridBody]: ${body.constructor.name} unavailable; continuing without it.`, error);
            }
        }

        if (this.activeBodies.length === 0) {
            throw new Error("No robot body backends initialized.");
        }
    }

    public async free(): Promise<void> {
        for (const body of this.activeBodies){
            await body.free();
        }
        this.activeBodies = [];
    }

    public async setExpression(expression: string, durationMs?: number): Promise<void> {
        await this.sendToBodies((body) => body.setExpression(expression, durationMs));
    }

    public async speak(text: string): Promise<void> {
        await this.sendToBodies((body) => body.speak(text));
    }

    public async lookAt(x: number, y: number): Promise<void> {
        await this.sendToBodies((body) => body.lookAt(x, y));
    }

    public async moveEar(left: number, right: number): Promise<void> {
        await this.sendToBodies((body) => body.moveEar(left, right));
    }

    public async setStatusLight(state: RobotStatusLight): Promise<void> {
        await this.sendToBodies((body) => body.setStatusLight(state));
    }

    private async sendToBodies(action: (body: RobotBody) => Promise<void>): Promise<void> {
        const results = await Promise.allSettled(this.activeBodies.map(action));
        for (const result of results) {
            if (result.status === "rejected") {
                console.warn("[HybridBody]: Body command failed.", result.reason);
            }
        }
    }
}
