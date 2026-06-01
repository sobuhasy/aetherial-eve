import { RobotBody } from "./RobotBody";
import { VTubeBody } from "./VTubeBody";

export type BodyBackend = "vtube";

export function createRobotBody(backend: BodyBackend = "vtube"): RobotBody {
    if (backend === "vtube"){
        return new VTubeBody();
    }

    return new VTubeBody();
}