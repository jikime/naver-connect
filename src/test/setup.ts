// vitest 공용 셋업 — node 테스트에는 HTTP 서버가 없으므로 매칭 클라이언트의 transport를
// 서버 서비스 함수에 직접 연결한다(경계 계약은 동일: MatchingRequest → MatchingBundle,
// SafeTextConfirmRequest → SafeTextConfirmResult[]).
// 근거: C3(codex final-rereview-reject #1), M2 P1-1, src/lib/dal/matching.ts transport 계약

import { setMatchingTransport, setSafeTextTransport } from "@/lib/dal/matching";
import {
  computeMatchingBundle,
  confirmSafeMatchTexts,
} from "@/lib/server/matching-service";

setMatchingTransport(async (req) => computeMatchingBundle(req));
setSafeTextTransport(async (req) => confirmSafeMatchTexts(req));
