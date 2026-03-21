import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const HIGH_KEYWORDS = [
  "refused", "denied", "turned away", "would not allow", "called police",
  "kicked out", "no access", "couldn't enter", "could not enter",
  "unable to enter", "locked", "blocked", "dangerous", "fell",
  "injured", "hurt", "unsafe", "emergency", "hospitalized",
  "discriminated", "police", "911", "threatened", "humiliated"
];

const MEDIUM_KEYWORDS = [
  "difficult", "struggled", "had to wait", "no alternative", "every time",
  "repeatedly", "ongoing", "persistent", "impossible", "cannot use",
  "can't use", "couldn't use", "inaccessible", "not accessible",
  "no way to", "had to leave", "gave up", "frustrating", "unacceptable",
  "barrier", "obstacle", "no ramp", "too narrow", "couldn't reach",
  "can not access", "too small"
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

  if (data.business_name && data.business_name.trim().length >= 3) {
    score += 20;
  } else {
    flags.push("vague_business_name");
  }

  if (data.business_type && data.business_type.trim()) score += 5;
  if (data.city && data.city.trim()) score += 5;
  if (data.state && data.state.trim()) score += 5;

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

  if (data.incident_date && data.incident_date.trim()) {
    score += 10;
  } else {
    flags.push("no_incident_date");
  }

  const narrativeLen = (data.narrative || "").trim().length;
  if (narrativeLen >= 100) {
    score += 10;
    if (narrativeLen >= 200) score += 10;
  } else {
    flags.push("short_narrative");
  }

  if (data.contact_name && data.contact_name.trim()) {
    score += 5;
  } else {
    flags.push("missing_contact_name");
  }

  if (data.contact_email && data.contact_email.trim()) {
    score += 5;
  } else {
    flags.push("missing_contact_email");
  }

  if (data.contact_phone && data.contact_phone.trim()) {
    score += 5;
  } else {
    flags.push("missing_contact_phone");
  }

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

    // Admin only
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch ALL cases (paginate with 500 per page)
    let allCases = [];
    let offset = 0;
    const pageSize = 500;
    while (true) {
      const page = await base44.asServiceRole.entities.Case.filter({}, 'created_date', pageSize, offset);
      allCases = allCases.concat(page);
      if (page.length < pageSize) break;
      offset += pageSize;
    }

    console.log(`Total cases fetched: ${allCases.length}`);

    // Filter to those not yet processed
    const toProcess = allCases.filter(c => !c.ai_processed_at);
    console.log(`Cases needing backfill: ${toProcess.length}`);

    const now = new Date().toISOString();
    let processed = 0;

    // Step 1: Process each case individually (except cluster size)
    for (const c of toProcess) {
      const ai_summary = buildSummary(c);
      const ai_category = categorize(c);
      const ai_severity = assessSeverity(c.narrative);
      const { score: ai_completeness_score, flags: ai_completeness_flags } = scoreCompleteness(c);
      const ai_duplicate_cluster_id = buildClusterId(c);

      await base44.asServiceRole.entities.Case.update(c.id, {
        ai_summary,
        ai_category,
        ai_severity,
        ai_completeness_score,
        ai_completeness_flags,
        ai_duplicate_cluster_id,
        ai_processed_at: now,
      });

      // Update in-memory too for cluster counting
      c.ai_duplicate_cluster_id = ai_duplicate_cluster_id;
      processed++;
    }

    // Also compute cluster IDs for already-processed cases (for accurate cluster counts)
    for (const c of allCases) {
      if (!c.ai_duplicate_cluster_id) {
        c.ai_duplicate_cluster_id = buildClusterId(c);
      }
    }

    // Step 2: Compute cluster sizes across ALL cases
    const clusterCounts = {};
    for (const c of allCases) {
      const cid = c.ai_duplicate_cluster_id;
      if (cid) {
        clusterCounts[cid] = (clusterCounts[cid] || 0) + 1;
      }
    }

    // Step 3: Update cluster sizes where they differ
    let clusterUpdates = 0;
    for (const c of allCases) {
      const cid = c.ai_duplicate_cluster_id;
      const correctSize = clusterCounts[cid] || 1;
      if (c.ai_duplicate_cluster_size !== correctSize) {
        await base44.asServiceRole.entities.Case.update(c.id, {
          ai_duplicate_cluster_size: correctSize,
        });
        clusterUpdates++;
      }
    }

    const uniqueClusters = Object.values(clusterCounts).filter(v => v >= 2).length;

    return Response.json({
      success: true,
      total_cases: allCases.length,
      cases_processed: processed,
      cluster_size_updates: clusterUpdates,
      unique_clusters_with_2_plus: uniqueClusters,
    });
  } catch (error) {
    console.error("backfillCaseAI error:", error.message, error.stack);
    return Response.json({ error: error.message }, { status: 500 });
  }
});