/** Shared fixtures for the civil rights complaint tests. */

/** A complete, valid Arizona answer set. */
export function validAz(): Record<string, string> {
  return {
    complainant_name: 'Jordan Rivera',
    phone: '602-555-0142',
    email: 'jordan@example.com',
    address1: '100 W Main St',
    address2: 'Apt 4',
    city: 'Mesa',
    state: 'AZ',
    zip: '85201',
    alt_contact_name: 'Sam Rivera',
    alt_contact_phone: '602-555-0199',
    respondent_name: 'Desert Grill',
    respondent_company: 'Desert Grill LLC',
    respondent_address1: '22 E Center St',
    respondent_address2: '',
    respondent_city: 'Mesa',
    respondent_state: 'AZ',
    respondent_zip: '85201',
    what_happened: 'The only entrance has three steps and no ramp. I could not get in.',
    witnesses: 'Sam Rivera',
    first_incident_date: '2026-03-02',
    last_incident_date: '2026-09-14',
    ongoing: 'yes',
    has_attorney: 'no',
    attorney_name_address: '',
    legal_action_pending: 'no',
    other_agencies: '',
    additional_comments: '',
  };
}
