// DAL 진입점 — 전 read/write 함수의 배럴 + 공통 에러 타입.
// 근거: ARCHITECTURE.md §5(Interface Design), §7 ADR-05(Promise 반환+ViewerContext 인자 계약)
// 컴포넌트는 이 배럴(또는 각 모듈)만 import한다. 시드는 여기서만 읽는다(FR-DA-01).

export * from "./collaboration";
export * from "./deal";
export * from "./ecosystem";
export * from "./errors";
export * from "./fields";
export * from "./gap-report";
export * from "./knowledge-graph";
export * from "./kpi";
export * from "./matching";
export * from "./meetups";
export * from "./members";
export * from "./onboarding";
export * from "./recommendations";
export * from "./resources";
export * from "./review";
export * from "./writes";
