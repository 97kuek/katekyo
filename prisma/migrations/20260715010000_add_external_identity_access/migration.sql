-- Separate external authentication identities from application profiles.
CREATE TYPE "IdentityProvider" AS ENUM ('google');
CREATE TYPE "ProfileAccessKind" AS ENUM ('owner', 'guardian');

CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "provider" "IdentityProvider" NOT NULL,
    "providerSubject" TEXT NOT NULL,
    "emailAtLink" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdentityAccess" (
    "id" TEXT NOT NULL,
    "identityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "ProfileAccessKind" NOT NULL DEFAULT 'owner',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdentityAccess_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "IdentityLinkIntent" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IdentityLinkIntent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthAuditLog" (
    "id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "userId" TEXT,
    "identityId" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthIdentity_provider_providerSubject_key" ON "AuthIdentity"("provider", "providerSubject");
CREATE UNIQUE INDEX "IdentityAccess_identityId_userId_key" ON "IdentityAccess"("identityId", "userId");
CREATE INDEX "IdentityAccess_userId_idx" ON "IdentityAccess"("userId");
CREATE UNIQUE INDEX "IdentityLinkIntent_tokenHash_key" ON "IdentityLinkIntent"("tokenHash");
CREATE INDEX "IdentityLinkIntent_userId_idx" ON "IdentityLinkIntent"("userId");
CREATE INDEX "IdentityLinkIntent_expiresAt_idx" ON "IdentityLinkIntent"("expiresAt");
CREATE INDEX "AuthAuditLog_userId_createdAt_idx" ON "AuthAuditLog"("userId", "createdAt");
CREATE INDEX "AuthAuditLog_identityId_createdAt_idx" ON "AuthAuditLog"("identityId", "createdAt");

ALTER TABLE "IdentityAccess" ADD CONSTRAINT "IdentityAccess_identityId_fkey" FOREIGN KEY ("identityId") REFERENCES "AuthIdentity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdentityAccess" ADD CONSTRAINT "IdentityAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "IdentityLinkIntent" ADD CONSTRAINT "IdentityLinkIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
