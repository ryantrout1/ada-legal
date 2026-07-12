-- Migration 0038 — drop the dead firm_session_handled table.
--
-- The session-based portal path (listPortalQueueForFirm / getPortalCaseForFirm /
-- markFirmSessionHandled + the /cases/[id]/handle endpoint) was superseded by
-- the cases-backed portal (listCasesForFirm + transitionCaseForFirm) and is now
-- fully orphaned — no live caller, no frontend reference. firm_session_handled
-- was written only by that path.
--
-- Safe: 0 rows, 0 inbound FKs. Its own outbound FKs drop with the table.
--
-- Ref: /triage->/fixit "retire the dead session-based portal path".

DROP TABLE IF EXISTS firm_session_handled;
