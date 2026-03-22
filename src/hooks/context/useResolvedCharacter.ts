import { useMemo } from 'react';
import { CharacterSheetData, TraitEntry } from '../../types';
import { RulesData } from '../../types/rules';
import { formatCalendarDate, formatSimpleDate } from '../../utils/dateUtils';

/**
 * Hook to resolve character data by merging personal choices with campaign rules.
 * This is the "Runtime Resolution" layer that allows the storage to stay thin.
 */
export const useResolvedCharacter = (data: CharacterSheetData, rules: RulesData | null) => {
  return useMemo(() => {
    if (!rules) return data;

    // Deep clone to avoid mutating the original state
    const resolved: CharacterSheetData = JSON.parse(JSON.stringify(data));

    // 0. Resolve Campaign Dates (Single Source of Truth)
    if (rules.configurations?.calendar) {
        const cal = rules.configurations.calendar;
        if (cal.type === 'fictional') {
            resolved.header.fictionCurrentDate = formatCalendarDate(cal);
        } else {
            resolved.header.fictionCurrentDate = formatSimpleDate(cal.currentDate);
        }
        
        // Also sync campaign start date if available in rules
        if (cal.type === 'real' && cal.startDate) {
           resolved.header.campaignStartDate = formatSimpleDate(cal.startDate);
        }
    }

    // 1. Resolve Skills
    Object.keys(resolved.skills).forEach(cat => {
      resolved.skills[cat] = resolved.skills[cat].map(skill => {
        if (!skill.name) return skill;
        
        // Find matching definition in rules library
        const ruleDef = rules.libraries.skills.find(s => 
          s.id === skill.definitionId || s.name.toLowerCase() === skill.name.toLowerCase()
        );

        if (ruleDef) {
          return {
            ...skill,
            name: ruleDef.name, // Ensure official name
            description: ruleDef.description ?? undefined, // Official description (fix null)
            isVariable: ruleDef.isVariable ?? skill.isVariable,
            definitionId: ruleDef.id,
            // Keep player's variant and customNotes
          };
        }
        return skill;
      });
    });

    // 2. Resolve Attributes
    Object.keys(resolved.attributes).forEach(cat => {
      resolved.attributes[cat] = resolved.attributes[cat].map(attr => {
        // Find official label for this attribute in definitions
        // (Attributes are just names in rules.definitions.attributes)
        // This is mostly for capitalization or consistency.
        const ruleNames = Object.values(rules.definitions.attributes).flat();
        const ruleName = ruleNames.find(n => n.toLowerCase() === attr.name.toLowerCase());
        
        if (ruleName) {
            return { ...attr, name: ruleName };
        }
        return attr;
      });
    });

    // 3. Resolve Traits (Page 2)
    const resolveTrait = (trait: TraitEntry) => {
      if (!trait.name) return trait;
      const ruleDef = rules.libraries.traits.find(t => 
        t.id === trait.definitionId || t.name.toLowerCase() === trait.name.toLowerCase()
      );

      if (ruleDef) {
        return {
          ...trait,
          name: ruleDef.name,
          description: (ruleDef.description ?? undefined) || trait.description,
          definitionId: ruleDef.id,
          type: (ruleDef.type as 'avantage' | 'desavantage') || trait.type,
          mysticAbilityId: ruleDef.mysticAbilityId || trait.mysticAbilityId
        };
      }
      return trait;
    };

    resolved.page2.avantages = resolved.page2.avantages.map(resolveTrait);
    resolved.page2.desavantages = resolved.page2.desavantages.map(resolveTrait);

    // 4. Resolve Counters
    Object.keys(resolved.counters).forEach(key => {
      const counter = resolved.counters[key];
      if (Array.isArray(counter)) {
        (resolved.counters as Record<string, unknown>)[key] = counter.map(c => {
           const ruleDef = rules.libraries.counters?.find(rc => rc.id === c.id || rc.name.toLowerCase() === c.name.toLowerCase());
           if (ruleDef) return { ...c, name: ruleDef.name, description: ruleDef.description ?? undefined, max: ruleDef.maxValue || c.max };
           return c;
        });
      } else if (typeof counter === 'object' && counter !== null) {
         // System counters (volonte, confiance)
         const counterObj = counter as unknown as Record<string, unknown>;
         const sysDef = Object.values(rules.definitions.counters).find(rc => rc.id === counterObj.id || rc.name.toLowerCase() === String(counterObj.name).toLowerCase());
         if (sysDef) {
           (resolved.counters as Record<string, unknown>)[key] = {
             ...counterObj,
             name: sysDef.name,
             description: sysDef.description ?? undefined,
             max: sysDef.max || (counterObj.max as number)
           };
         }
      }
    });

    // 5. Populate Libraries for compatibility
    resolved.library = rules.libraries.traits || [];
    resolved.skillLibrary = rules.libraries.skills || [];
    resolved.specializationLibrary = rules.libraries.specializations || [];
    resolved.backgroundLibrary = rules.libraries.backgrounds || [];
    resolved.counterLibrary = rules.libraries.counters || [];
    resolved.mysticAbilities = rules.libraries.mysticAbilities || [];

    return resolved;
  }, [data, rules]);
};
