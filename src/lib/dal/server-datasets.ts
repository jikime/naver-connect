import "server-only";

// Server Component가 데이터 저장소 구현 경로를 직접 참조하지 않도록 둔 서버 전용 경계다.
// Client Component에서는 이 모듈 대신 getDataset()을 사용한다.
export {
  getDatasetDocument,
  getServerDataset,
} from "@/lib/server/dataset-repository";
