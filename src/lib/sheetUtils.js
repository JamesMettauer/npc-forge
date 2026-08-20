/** Helpers for the NPC Character Sheet system */

export const abilityMod = (score) => Math.floor((score - 10) / 2);
export const fmtMod = (n) => (n >= 0 ? `+${n}` : `${n}`);

/** Build PDF-compatible flat data object from NPC record */
export function buildSheetData(npc) {
  const s = npc.sheet || {};
  const prof = npc.proficiency_bonus || 2;

  const mod = (score) => (score != null ? abilityMod(score) : 0);
  const save = (score, hasProf) => {
    const m = mod(score);
    return hasProf ? m + prof : m;
  };

  const str = s.str_score; const dex = s.dex_score; const con = s.con_score;
  const int = s.int_score; const wis = s.wis_score; const cha = s.cha_score;

  // Determine role_class for PDF
  let role_class = '';
  if (npc.class_name) {
    role_class = npc.subclass ? `${npc.class_name} — ${npc.subclass}` : npc.class_name;
  } else if (npc.occupation || npc.role) {
    role_class = npc.occupation || npc.role;
  }

  // Determine level_cr
  let level_cr = '';
  if (npc.level) level_cr = `Level ${npc.level}`;
  else if (npc.challenge_rating) level_cr = `CR ${npc.challenge_rating}`;

  const wis_mod = mod(wis);
  const perception_prof_bonus = s.skill_proficiencies?.toLowerCase().includes('perception') ? prof : 0;
  const passive_perc = s.passive_perception ?? (10 + wis_mod + perception_prof_bonus);
  const initiative = s.initiative ?? mod(dex);

  return {
    npc_name: npc.name || '',
    species: npc.species || '',
    role_class,
    level_cr,
    alignment: npc.alignment || '',
    size_type: s.size_type || '',
    faction: npc.faction || '',
    background_role: s.background_role || npc.occupation || '',
    pronouns: npc.pronouns || '',
    disposition: s.disposition || npc.initial_attitude || '',
    armor_class: npc.armor_class ?? '',
    hp_max: npc.hit_points ?? '',
    hp_current: s.hp_current ?? npc.hit_points ?? '',
    speed: npc.speed || '',
    initiative: initiative !== 0 ? fmtMod(initiative) : '',
    proficiency_bonus: prof ? fmtMod(prof) : '',
    passive_perception: passive_perc,
    str_score: str ?? '',
    str_mod: str != null ? fmtMod(mod(str)) : '',
    str_save: str != null ? fmtMod(save(str, s.str_save_prof)) : '',
    str_save_prof: !!s.str_save_prof,
    dex_score: dex ?? '',
    dex_mod: dex != null ? fmtMod(mod(dex)) : '',
    dex_save: dex != null ? fmtMod(save(dex, s.dex_save_prof)) : '',
    dex_save_prof: !!s.dex_save_prof,
    con_score: con ?? '',
    con_mod: con != null ? fmtMod(mod(con)) : '',
    con_save: con != null ? fmtMod(save(con, s.con_save_prof)) : '',
    con_save_prof: !!s.con_save_prof,
    int_score: int ?? '',
    int_mod: int != null ? fmtMod(mod(int)) : '',
    int_save: int != null ? fmtMod(save(int, s.int_save_prof)) : '',
    int_save_prof: !!s.int_save_prof,
    wis_score: wis ?? '',
    wis_mod: wis != null ? fmtMod(mod(wis)) : '',
    wis_save: wis != null ? fmtMod(save(wis, s.wis_save_prof)) : '',
    wis_save_prof: !!s.wis_save_prof,
    cha_score: cha ?? '',
    cha_mod: cha != null ? fmtMod(mod(cha)) : '',
    cha_save: cha != null ? fmtMod(save(cha, s.cha_save_prof)) : '',
    cha_save_prof: !!s.cha_save_prof,
    skill_proficiencies: s.skill_proficiencies || npc.skills || '',
    languages_senses: s.languages_senses || [npc.languages, npc.senses].filter(Boolean).join(', ') || '',
    resistances_immunities: s.resistances_immunities || npc.damage_defenses || '',
    personality: s.personality || npc.personality_traits || '',
    motivation: s.motivation || npc.goals || '',
    appearance: s.appearance || [npc.physical_description, npc.distinguishing_features].filter(Boolean).join('\n') || '',
    attack_1_name: s.attack_1_name || '',
    attack_1_bonus: s.attack_1_bonus || '',
    attack_1_damage: s.attack_1_damage || '',
    attack_1_notes: s.attack_1_notes || '',
    attack_2_name: s.attack_2_name || '',
    attack_2_bonus: s.attack_2_bonus || '',
    attack_2_damage: s.attack_2_damage || '',
    attack_2_notes: s.attack_2_notes || '',
    attack_3_name: s.attack_3_name || '',
    attack_3_bonus: s.attack_3_bonus || '',
    attack_3_damage: s.attack_3_damage || '',
    attack_3_notes: s.attack_3_notes || '',
    actions_reactions: s.actions_reactions || [npc.actions, npc.bonus_actions, npc.reactions].filter(Boolean).join('\n\n') || '',
    features_traits: s.features_traits || npc.traits || '',
    spellcasting: s.spellcasting || npc.spells || '',
    equipment: s.equipment || npc.equipment || '',
    notes: s.notes || npc.secrets || '',
  };
}

/** Fill the PDF using pdf-lib and return bytes */
export async function exportToPDF(npc, flatten = false) {
  const { PDFDocument, PDFTextField, PDFCheckBox } = await import('pdf-lib');
  const pdfUrl = 'https://media.base44.com/files/public/6a6a67bab00134fba7b5ee69/2827b2230_Base44_NPC_Character_Sheet.pdf';
  const resp = await fetch(pdfUrl);
  if (!resp.ok) throw new Error('Could not load PDF template');
  const pdfBytes = await resp.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const data = buildSheetData(npc);

  const setField = (name, value) => {
    if (value === '' || value == null) return;
    try {
      const field = form.getField(name);
      if (!field) return;
      if (field instanceof PDFTextField) field.setText(String(value));
      else if (field instanceof PDFCheckBox) { if (value) field.check(); else field.uncheck(); }
    } catch { /* field not in this PDF version */ }
  };

  Object.entries(data).forEach(([k, v]) => setField(k, v));

  if (flatten) form.flatten();

  return pdfDoc.save();
}

export function downloadPDF(bytes, filename) {
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.replace(/[^a-zA-Z0-9_\- .]/g, '_') + '.pdf';
  a.click();
  URL.revokeObjectURL(url);
}
