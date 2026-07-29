import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { USER_ROLES, type UserRole } from "@/lib/auth/types";
import { credentialsSchema } from "@/lib/auth/validation";
import {
  authenticateCredentials,
  getAuthUserById,
} from "@/lib/server/auth-repository";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "이메일", type: "email" },
        password: { label: "비밀번호", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;
        return authenticateCredentials(parsed.data.email, parsed.data.password);
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.personaId = user.personaId;
        token.onboardingComplete = user.onboardingComplete;
        token.sessionVersion = user.sessionVersion;
      }

      // JWT에 들어 있는 온보딩 상태는 완료 직후나 다른 브라우저에서 변경되면
      // 오래된 값일 수 있다. 로그인 이후의 세션 확인에서는 DB를 기준으로 갱신한다.
      if (!user && token.sub) {
        const current = await getAuthUserById(token.sub);
        if (current) {
          token.name = current.name;
          token.email = current.email;
          token.role = current.role;
          token.personaId = current.personaId;
          token.onboardingComplete = current.onboardingComplete;
          token.sessionVersion = current.sessionVersion;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = USER_ROLES.includes(token.role as UserRole)
        ? (token.role as UserRole)
        : "기업가";
      session.user.personaId =
        typeof token.personaId === "string"
          ? token.personaId
          : (token.sub ?? "");
      session.user.onboardingComplete = token.onboardingComplete === true;
      session.user.sessionVersion =
        typeof token.sessionVersion === "number" ? token.sessionVersion : 1;
      return session;
    },
  },
});
