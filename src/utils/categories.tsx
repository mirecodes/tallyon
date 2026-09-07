import {
  Train,
  Shirt,
  Utensils,
  Repeat,
  Landmark,
  Home,
  HeartPulse,
  ShoppingBag,
  Plane,
  GraduationCap,
  Tag,
  Gift,
} from 'lucide-react';
import React from 'react';
import { supabase, isSupabaseConfigured, ensureAuthUser } from '../services/supabase';

export interface CategoryDefinition {
  id: string;            // Key / value saved in transaction (English)
  name: string;          // English display name
  color: string;         // Dedicated distinct hex color
  bgColor: string;       // Soft background tint for badges
}

/**
 * 11 Canonical Categories:
 * Transport / Living / Food / Subscriptions / Administration /
 * Housing / Health / Education / Shopping / Travel / Other
 */
export const DEFAULT_CATEGORIES: CategoryDefinition[] = [
  { id: 'Transport', name: 'Transport', color: '#3B82F6', bgColor: '#EFF6FF' },
  { id: 'Living', name: 'Living', color: '#10B981', bgColor: '#ECFDF5' },
  { id: 'Food', name: 'Food', color: '#F59E0B', bgColor: '#FFFBEB' },
  { id: 'Subscriptions', name: 'Subscriptions', color: '#EC4899', bgColor: '#FDF2F8' },
  { id: 'Administration', name: 'Administration', color: '#6366F1', bgColor: '#EEF2FF' },
  { id: 'Housing', name: 'Housing', color: '#8B5CF6', bgColor: '#F5F3FF' },
  { id: 'Health', name: 'Health', color: '#14B8A6', bgColor: '#F0FDFA' },
  { id: 'Education', name: 'Education', color: '#0EA5E9', bgColor: '#F0F9FF' },
  { id: 'Shopping', name: 'Shopping', color: '#F97316', bgColor: '#FFF7ED' },
  { id: 'Travel', name: 'Travel', color: '#06B6D4', bgColor: '#ECFEFF' },
  { id: 'Other', name: 'Other', color: '#64748B', bgColor: '#F8FAFC' },
];

const STORAGE_KEY = '@app/custom_categories_v1';

/**
 * Get the current categories from LocalStorage, or fallback to DEFAULT_CATEGORIES.
 * Also cleanses obsolete/legacy categories (e.g. "Groceries" -> "Food") and ensures canonical categories exist.
 */
export function getSavedCategories(): CategoryDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Cleanse legacy category names like "Groceries" -> "Food"
        let migrated = parsed.map((c: CategoryDefinition) => {
          if (c.id?.toLowerCase() === 'groceries' || c.name?.toLowerCase() === 'groceries') {
            return { id: 'Food', name: 'Food', color: '#F59E0B', bgColor: '#FFFBEB' };
          }
          return c;
        });

        // Deduplicate by ID
        const seen = new Set<string>();
        migrated = migrated.filter((c) => {
          const key = c.id.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        // Ensure canonical categories exist
        for (const canonical of DEFAULT_CATEGORIES) {
          if (!seen.has(canonical.id.toLowerCase())) {
            const otherIdx = migrated.findIndex((c) => c.id.toLowerCase() === 'other');
            if (otherIdx !== -1) {
              migrated.splice(otherIdx, 0, canonical);
            } else {
              migrated.push(canonical);
            }
            seen.add(canonical.id.toLowerCase());
          }
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
        return migrated;
      }
    }
  } catch (err) {
    console.error('Failed to parse categories from storage:', err);
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Persist categories to LocalStorage and sync to Supabase user_categories table if configured.
 */
export function saveCategories(categories: CategoryDefinition[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new Event('categories-changed'));
  } catch (err) {
    console.error('Failed to save categories to storage:', err);
  }

  // Background sync to Supabase user_categories
  const client = supabase;
  if (isSupabaseConfigured && client) {
    ensureAuthUser().then(async (userId) => {
      const rows = categories.map((cat, index) => ({
        user_id: userId,
        category_id: cat.id,
        name: cat.name,
        color: cat.color,
        bg_color: cat.bgColor,
        sort_order: index,
        updated_at: new Date().toISOString(),
      }));

      await client
        .from('user_categories')
        .upsert(rows, { onConflict: 'user_id, category_id' });
    }).catch(() => {});
  }
}

/**
 * Hook for components to consume and listen to category changes.
 */
export function useCategories() {
  const [categories, setCategories] = React.useState<CategoryDefinition[]>(() => getSavedCategories());

  React.useEffect(() => {
    const handler = () => {
      setCategories(getSavedCategories());
    };
    window.addEventListener('categories-changed', handler);

    // Initial sync check from Supabase user_categories
    const client = supabase;
    if (isSupabaseConfigured && client) {
      ensureAuthUser().then(async (userId) => {
        const { data, error } = await client
          .from('user_categories')
          .select('*')
          .eq('user_id', userId)
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const fetchedCategories: CategoryDefinition[] = data.map((row) => ({
            id: row.category_id,
            name: row.name,
            color: row.color,
            bgColor: row.bg_color,
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(fetchedCategories));
          setCategories(fetchedCategories);
        }
      }).catch(() => {});
    }

    return () => window.removeEventListener('categories-changed', handler);
  }, []);

  const updateCategories = (newCategories: CategoryDefinition[]) => {
    saveCategories(newCategories);
    setCategories(newCategories);
  };

  const resetToDefault = () => {
    saveCategories(DEFAULT_CATEGORIES);
    setCategories(DEFAULT_CATEGORIES);
  };

  return {
    categories,
    updateCategories,
    resetToDefault,
  };
}

/**
 * Find category color by category name or fallback.
 */
export function getCategoryColor(categoryName: string, categories: CategoryDefinition[] = DEFAULT_CATEGORIES): string {
  const found = categories.find(
    (c) =>
      c.id.toLowerCase() === categoryName.toLowerCase() ||
      c.name.toLowerCase() === categoryName.toLowerCase()
  );
  if (found) return found.color;

  // Fallback heuristics for legacy data
  const lower = categoryName.toLowerCase();
  if (lower.includes('groc')) return '#10B981';
  if (lower.includes('edu') || lower.includes('book')) return '#6366F1';
  if (lower.includes('rent') || lower.includes('hous')) return '#8B5CF6';
  return '#64748B';
}

/**
 * Return matching Lucide Icon element accurately matched to each category meaning.
 * - Transport: Train (기차/대중교통/교통편)
 * - Living: Shirt (의류/생활/일상)
 * - Food: Utensils (식비/외식)
 * - Gift: Gift (선물/선물상자)
 * - Subscriptions: Repeat (정기구독/반복결제)
 * - Administration: Landmark (공공기관/행정/관공서)
 * - Housing: Home (주거/월세/주택)
 * - Health: HeartPulse (의료/건강)
 * - Education: GraduationCap (교육/강의/학습)
 * - Shopping: ShoppingBag (쇼핑/구매)
 * - Travel: Plane (여행/항공/해외)
 * - Other: Tag (기타)
 */
export function getCategoryIconElement(categoryName: string, size = 15) {
  const lower = categoryName.toLowerCase();

  if (lower.includes('trans') || lower.includes('교통') || lower.includes('train') || lower.includes('rail') || lower.includes('bus') || lower.includes('metro')) {
    return <Train size={size} />;
  }
  if (lower.includes('liv') || lower.includes('생활') || lower.includes('cloth') || lower.includes('shirt') || lower.includes('wear') || lower.includes('cafe') || lower.includes('coffee')) {
    return <Shirt size={size} />;
  }
  if (lower.includes('gift') || lower.includes('선물') || lower.includes('present')) {
    return <Gift size={size} />;
  }
  if (lower.includes('food') || lower.includes('음식') || lower.includes('meal') || lower.includes('dine') || lower.includes('eat')) {
    return <Utensils size={size} />;
  }
  if (lower.includes('sub') || lower.includes('구독') || lower.includes('recur') || lower.includes('stream')) {
    return <Repeat size={size} />;
  }
  if (lower.includes('admin') || lower.includes('행정') || lower.includes('gov') || lower.includes('tax') || lower.includes('bank')) {
    return <Landmark size={size} />;
  }
  if (lower.includes('hous') || lower.includes('주택') || lower.includes('rent') || lower.includes('home')) {
    return <Home size={size} />;
  }
  if (lower.includes('health') || lower.includes('건강') || lower.includes('med') || lower.includes('pharm') || lower.includes('doc')) {
    return <HeartPulse size={size} />;
  }
  if (lower.includes('edu') || lower.includes('교육') || lower.includes('학습') || lower.includes('study') || lower.includes('course') || lower.includes('lecture')) {
    return <GraduationCap size={size} />;
  }
  if (lower.includes('shop') || lower.includes('쇼핑') || lower.includes('buy') || lower.includes('store')) {
    return <ShoppingBag size={size} />;
  }
  if (lower.includes('trav') || lower.includes('여행') || lower.includes('flight') || lower.includes('hotel') || lower.includes('tour')) {
    return <Plane size={size} />;
  }

  return <Tag size={size} />;
}
