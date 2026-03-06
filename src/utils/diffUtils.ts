import { CharacterSheetData, DotEntry } from '../types';

export interface DataDiff {
  path: string;
  label: string;
  local: unknown;
  remote: unknown;
}

/**
 * Compares two character sheets and returns a list of differences.
 * Focused on fields that players or MJs usually modify.
 */
export const getCharacterDiff = (local: CharacterSheetData, remote: CharacterSheetData): DataDiff[] => {
  const diffs: DataDiff[] = [];

  if (!local || !remote) return diffs;

  // 1. Header
  if (local.header && remote.header) {
    const headerFields: (keyof typeof local.header)[] = ['name', 'player', 'chronicle', 'nature', 'conduct'];
    headerFields.forEach(field => {
      if (local.header[field] !== remote.header[field]) {
        diffs.push({
          path: `header.${field}`,
          label: `En-tête : ${field}`,
          local: local.header[field],
          remote: remote.header[field]
        });
      }
    });
  }

  // 2. Attributes
  Object.keys(local.attributes).forEach(cat => {
    const localCat = local.attributes[cat];
    const remoteCat = remote.attributes[cat];
    if (!localCat || !remoteCat) return;

    localCat.forEach((attr, idx) => {
      const remoteAttr = remoteCat[idx];
      if (!remoteAttr) return;
      
      ['val1', 'val2', 'val3'].forEach(v => {
        const field = v as 'val1' | 'val2' | 'val3';
        if (attr[field] !== remoteAttr[field]) {
          diffs.push({
            path: `attributes.${cat}.${idx}.${field}`,
            label: `Attribut : ${attr.name} (${field})`,
            local: attr[field],
            remote: remoteAttr[field]
          });
        }
      });
    });
  });

  // 3. Skills (Flattened check)
  const getFlatSkills = (d: CharacterSheetData) => 
    Object.values(d.skills).flat().filter(s => s.name);

  const localSkills = getFlatSkills(local);
  const remoteSkills = getFlatSkills(remote);

  localSkills.forEach(ls => {
    const rs = remoteSkills.find(s => s.id === ls.id || s.name === ls.name);
    if (rs && ls.value !== rs.value) {
      diffs.push({
        path: `skills.id:${ls.id}.value`,
        label: `Compétence : ${ls.name}`,
        local: ls.value,
        remote: rs.value
      });
    }
  });

  // 4. Counters
  Object.keys(local.counters).forEach(key => {
    if (key === 'custom') return;
    const lc = local.counters[key] as DotEntry;
    const rc = remote.counters[key] as DotEntry;
    if (rc && lc.value !== rc.value) {
      diffs.push({
        path: `counters.${key}.value`,
        label: `Compteur : ${lc.name}`,
        local: lc.value,
        remote: rc.value
      });
    }
  });

  // 5. XP
  if (local.experience.gain !== remote.experience.gain) {
    diffs.push({
      path: 'experience.gain',
      label: 'XP Totaux',
      local: local.experience.gain,
      remote: remote.experience.gain
    });
  }

  return diffs;
};
