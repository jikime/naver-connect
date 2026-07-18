// DAL 공통 에러 — getReviewQueue/approveRecommendation의 403 시뮬레이션.
// 근거: ARCHITECTURE.md §5.3 접근제어 계약("vc.role!=='운영자'이면 Promise.reject(new ForbiddenError())")

export class ForbiddenError extends Error {
  constructor(message = "운영자만 접근할 수 있습니다") {
    super(message);
    this.name = "ForbiddenError";
  }
}
