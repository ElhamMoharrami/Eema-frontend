import * as shape from "./response-shape";
import { apiRequest } from "./client";
import type { MatchRequest, MatchResponse } from "@/types/match";

export const matchVenues = (request: MatchRequest) =>
  apiRequest<MatchResponse>("/match", { validate: shape.match, method: "POST", auth: "required", body: request });
