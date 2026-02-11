import { supabase } from './supabase';
import { ErrorService } from './ErrorService';

/**
 * Generic Database Service to abstract Supabase calls.
 * Provides consistent error handling and typing.
 */
export const DatabaseService = {

    /**
     * Execute a Supabase query builder and handle errors automatically.
     * Useful for complex queries constructed outside.
     */
    async execute<T>(
        queryPromise: PromiseLike<{ data: T | null; error: any }>,
        context: string,
        userMessage: string
    ): Promise<T | null> {
        // Supabase client does not throw, it returns error object.
        // However, if the promise rejects (network failure etc), we catch it.
        try {
            const { data, error } = await queryPromise;

            if (error) {
                // Determine if it's a "No rows found" error which might not be critical depending on context
                // But generally, if the caller expected data, it's an error.
                // The caller can check for null data.
                ErrorService.handleError(error, { context, userMessage });
                return null;
            }

            return data;
        } catch (e) {
            ErrorService.handleError(e, { context, userMessage });
            return null;
        }
    },

    /**
     * Fetch a single record by ID.
     */
    async fetchOne<T>(
        table: string,
        id: string,
        context: string = `DatabaseService.fetchOne(${table})`
    ): Promise<T | null> {
        const { data, error } = await supabase
            .from(table)
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            // PGRST116 means no rows returned for .single(), which is valid "null" result mostly
            if (error.code === 'PGRST116') return null;

            ErrorService.handleError(error, { context, userMessage: "Erreur lors de la récupération de la donnée." });
            return null;
        }
        return data;
    },

    /**
     * Fetch all records matching a simple equality filter.
     */
    async fetchAll<T>(
        table: string,
        query: {
            eq?: Record<string, any>,
            or?: string,
            select?: string,
            order?: { column: string, ascending?: boolean },
            limit?: number
        } = {},
        context: string = `DatabaseService.fetchAll(${table})`
    ): Promise<T[]> {
        let builder = supabase.from(table).select(query.select || '*');

        if (query.or) {
            builder = builder.or(query.or);
        }

        if (query.eq) {
            Object.entries(query.eq).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    builder = builder.eq(key, value);
                } else if (value === null) {
                    builder = builder.is(key, null);
                }
            });
        }

        if (query.order) {
            builder = builder.order(query.order.column, { ascending: query.order.ascending ?? true });
        }

        if (query.limit) {
            builder = builder.limit(query.limit);
        }

        const { data, error } = await builder;

        if (error) {
            ErrorService.handleError(error, { context, userMessage: "Erreur lors de la liste des données." });
            return [];
        }

        return data as T[];
    },

    /**
     * Insert a record (or multiple).
     * @returns The inserted data (single object or array depending on input).
     */
    async insert<T>(
        table: string,
        data: any | any[],
        context: string = `DatabaseService.insert(${table})`
    ): Promise<T | T[] | null> {
        const isArray = Array.isArray(data);

        let resultPromise;
        if (isArray) {
            resultPromise = supabase.from(table).insert(data).select();
        } else {
            resultPromise = supabase.from(table).insert(data).select().single();
        }

        const { data: inserted, error } = await resultPromise;

        if (error) {
            ErrorService.handleError(error, { context, userMessage: "Erreur lors de la création." });
            return null;
        }
        return inserted as T | T[];
    },

    /**
     * Update a record by ID.
     */
    async update<T>(
        table: string,
        id: string,
        data: Partial<T>,
        context: string = `DatabaseService.update(${table})`
    ): Promise<boolean> {
        const { error } = await supabase
            .from(table)
            .update(data)
            .eq('id', id);

        if (error) {
            ErrorService.handleError(error, { context, userMessage: "Erreur lors de la mise à jour." });
            return false;
        }
        return true;
    },

    /**
     * Delete a record by ID.
     */
    async delete(
        table: string,
        id: string,
        context: string = `DatabaseService.delete(${table})`
    ): Promise<boolean> {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq('id', id);

        if (error) {
            ErrorService.handleError(error, { context, userMessage: "Erreur lors de la suppression." });
            return false;
        }
        return true;
    },

    /**
     * Delete multiple records by a specific column filter (e.g. setting_id)
     */
    async deleteBy(
        table: string,
        column: string,
        value: string,
        context: string = `DatabaseService.deleteBy(${table})`
    ): Promise<boolean> {
        const { error } = await supabase
            .from(table)
            .delete()
            .eq(column, value);

        if (error) {
            ErrorService.handleError(error, { context, userMessage: "Erreur lors du nettoyage des données." });
            return false;
        }
        return true;
    },

    /**
     * Upsert a record.
     */
    async upsert<T>(
        table: string,
        data: Partial<T> | any, // Use any for raw data if T is complex, but Partial<T> is preferred
        options: { onConflict?: string, ignoreDuplicates?: boolean } = {},
        context: string = `DatabaseService.upsert(${table})`
    ): Promise<T | null> {
        // Automatically add owner if missing and user is logged in
        if (table === 'characters' && !data.created_by) {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                data.created_by = user.id;
            }
        }

        const { data: result, error } = await supabase
            .from(table)
            .upsert(data, options)
            .select()
            .single();

        if (error) {
            ErrorService.handleError(error, { context, userMessage: "Erreur lors de la synchronisation (upsert)." });
            return null;
        }
        return result as T;
    },

    /**
     * Check if a table is accessible (HEAD request).
     */
    async checkAvailable(table: string): Promise<boolean> {
        try {
            const { error } = await supabase
                .from(table)
                .select('id', { count: 'exact', head: true });
            return !error;
        } catch {
            return false;
        }
    }
};
