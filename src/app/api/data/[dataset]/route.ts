import { auth } from "@/auth";
import {
  DatasetAccessDeniedError,
  scopeDatasetForViewer,
} from "@/lib/server/dataset-access";
import {
  DatasetNotFoundError,
  getDatasetDocument,
} from "@/lib/server/dataset-repository";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ dataset: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
  }
  const { dataset } = await context.params;
  try {
    const result = await getDatasetDocument<unknown>(dataset);
    const data = scopeDatasetForViewer(result.key, result.data, {
      role: session.user.role,
      personaId: session.user.personaId,
    });
    return Response.json(
      { ...result, data },
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  } catch (error) {
    if (error instanceof DatasetNotFoundError) {
      return Response.json({ message: error.message }, { status: 404 });
    }
    if (error instanceof DatasetAccessDeniedError) {
      return Response.json({ message: error.message }, { status: 403 });
    }
    console.error("데이터셋 조회 실패", { dataset });
    return Response.json(
      { message: "데이터를 불러오지 못했습니다." },
      { status: 500 },
    );
  }
}
