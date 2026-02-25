import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const HIGH_KEYWORDS = [
  "refused", "denied", "turned away", "would not allow", "called police",
  "kicked out", "no access", "couldn't enter", "could not enter",
  "unable to enter", "locked", "blocked", "dangerous", "fell",
  "injured", "hurt", "unsafe", "emergency", "ambulance",
  "hospitalized", "discriminated"
];

const MEDIUM_KEYWORDS = [
  "difficult", "struggled", "had to wait", "no alternative", "every time",
  "repeatedly", "ongoing", "persistent", "impossible", "cannot use",
  "can't use", "couldn't use", "inaccessible", "not accessible",
  "no way to", "had to leave", "gave up", "frustrating", "unacceptable"
];

const PHYSICAL_SUBTYPE_MAP = {
  "Parking": "physical_parking",
  "Entrance": "physical_entrance",
  "Restroom": "physical_restroom",
  "Path": "physical_path",
  "Service Animal": "physical_service_animal",
  "Other": "physical_other"
};

const DIGITAL_TECH_PRIORITY = [
  { tech: "Screen Reader", category: "digital_screen_reader" },
  { tech: "Keyboard-Only", category: "digital_keyboard_nav" },
  { tech: "Voice Control", category: "digital_voice_control" },
  { tech: "Screen Magnification", category: "digital_magnification" }
];

function buildSummary(data) {
  const narrative = (data.narrative || "").trim();
  const snippet = narrative.length > 80
    ? narrative.substring(0, 80).trim() + "..."
    : narrative;

  if (data.violation_type === "physical_space") {
    const subtype = data.violation_subtype || "Unknown";
    return `${subtype} issue at ${data.business_name || "Unknown"} in ${data.city || "Unknown"}, ${data.state || "??"} — ${snippet}`;
  }

  if (data.violation_type === "digital_website") {
    const domain = data.url_domain ? ` (${data.url_domain})` : "";
    return `Website accessibility issue at ${data.business_name || "Unknown"}${domain} — ${snippet}`;
  }

  return `ADA violation report at ${data.business_name || "Unknown"} — ${snippet}`;
}

function categorize(data) {
  if (data.violation_type === "physical_space") {
    return PHYSICAL_SUBTYPE_MAP[data.violation_subtype] || "physical_other";
  }

  if (data.violation_type === "digital_website") {
    const techs = data.assistive_tech || [];
    for (const entry of DIGITAL_TECH_PRIORITY) {
      if (techs.includes(entry.tech)) return entry.category;
    }
    return "digital_other";
  }

  return "other";
}

function assessSeverity(narrative) {
  const lower = (narrative || "").toLowerCase();
  for (const kw of HIGH_KEYWORDS) {
    if (lower.includes(kw)) return "high";
  }
  for (const kw of MEDIUM_KEYWORDS) {
    if (lower.includes(kw)) return "medium";
  }
  return "low";
}

function scoreCompleteness(data) {
  let score = 0;
  const flags = [];

  // business_name: +20 if 3+ chars
  if (data.business_name && data.business_name.trim().length >= 3) {
    score += 20;
  } else {
    flags.push("vague_business_name");
  }

  // business_type: +5
  if (data.business_type && data.business_type.trim()) score += 5;

  // city: +5
  if (data.city && data.city.trim()) score += 5;

  // state: +5
  if (data.state && data.state.trim()) score += 5;

  // street_address (physical) or url_domain (digital): +15
  if (data.violation_type === "physical_space") {
    if (data.street_address && data.street_address.trim()) {
      score += 15;
    } else {
      flags.push("no_address");
    }
  } else if (data.violation_type === "digital_website") {
    if (data.url_domain && data.url_domain.trim()) {
      score += 15;
    } else {
      flags.push("no_url");
    }
  }

  // incident_date: +10
  if (data.incident_date && data.incident_date.trim()) {
    score += 10;
  } else {
    flags.push("no_incident_date");
  }

  // narrative length
  const narrativeLen = (data.narrative || "").trim().length;
  if (narrativeLen >= 100) {
    score += 10;
    if (narrativeLen >= 200) score += 10;
  } else {
    flags.push("short_narrative");
  }

  // contact_name: +5
  if (data.contact_name && data.contact_name.trim()) {
    score += 5;
  } else {
    flags.push("missing_contact_name");
  }

  // contact_email: +5
  if (data.contact_email && data.contact_email.trim()) {
    score += 5;
  } else {
    flags.push("missing_contact_email");
  }

  // contact_phone: +5
  if (data.contact_phone && data.contact_phone.trim()) {
    score += 5;
  } else {
    flags.push("missing_contact_phone");
  }

  // visited_before: +5
  if (data.visited_before && data.visited_before.trim()) score += 5;

  return { score, flags: flags.join(",") };
}

function buildClusterId(data) {
  const name = (data.business_name || "").toLowerCase().replace(/[\s'\-.,&!@#$%^*()+=\[\]{}<>?/\\|`~"]/g, "");
  const city = (data.city || "").toLowerCase().replace(/\s/g, "");
  const state = (data.state || "").toLowerCase().replace(/\s/g, "");
  return `${name}_${city}_${state}`;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    const event = body.event;
    const data = body.data;

    // Only process create events for submitted cases
    if (!event || event.type !== "create") {
      return Response.json({ skipped: true, reason: "not a create event" });
    }

    if (!data || data.status !== "submitted") {
      return Response.json({ skipped: true, reason: "status is not submitted" });
    }

    const caseId = event.entity_id;

    // Step 1: Summary
    const ai_summary = buildSummary(data);

    // Step 2: Category
    const ai_category = categorize(data);

    // Step 3: Severity
    const ai_severity = assessSeverity(data.narrative);

    // Step 4: Completeness
    const { score: ai_completeness_score, flags: ai_completeness_flags } = scoreCompleteness(data);

    // Step 5: Cluster ID
    const ai_duplicate_cluster_id = buildClusterId(data);

    // Step 6: Timestamp
    const ai_processed_at = new Date().toISOString();

    // Update the new case with AI fields
    await base44.asServiceRole.entities.Case.update(caseId, {
      ai_summary,
      ai_category,
      ai_severity,
      ai_completeness_score,
      ai_completeness_flags,
      ai_duplicate_cluster_id,
      ai_processed_at
    });

    // Step 5b: Count cluster and update all cases in cluster
    const clusterCases = await base44.asServiceRole.entities.Case.filter({
      ai_duplicate_cluster_id: ai_duplicate_cluster_id
    });

    const clusterSize = clusterCases.length;

    // Update all cases in the cluster with the new size
    for (const c of clusterCases) {
      if (c.ai_duplicate_cluster_size !== clusterSize) {
        await base44.asServiceRole.entities.Case.update(c.id, {
          ai_duplicate_cluster_size: clusterSize
        });
      }
    }

    return Response.json({
      success: true,
      caseId,
      ai_summary,
      ai_category,
      ai_severity,
      ai_completeness_score,
      ai_completeness_flags,
      ai_duplicate_cluster_id,
      ai_duplicate_cluster_size: clusterSize,
      ai_processed_at
    });
  } catch (error) {
    console.error("processCaseAI error:", error.message);
    // Never block case creation — return success even on error
    return Response.json({ success: false, error: error.message }, { status: 200 });
  }
});