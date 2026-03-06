const express = require('express');

module.exports = (supabase) => {
    const router = express.Router();

    // GET all profiles (Typically for Admin Dashboard users tab)
    router.get('/', async (req, res) => {
        try {
            // We can optionally check auth here via headers
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // Using the global supabase client (with service key ideally) 
            // since fetching all profiles might normally be blocked by RLS for standard auth
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // GET a single profile by ID (For viewing your own profile or a specific user)
    router.get('/:id', async (req, res) => {
        const { id } = req.params;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) return res.status(404).json({ error: 'Profile not found' });

            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT to update a profile
    router.put('/:id', async (req, res) => {
        const { id } = req.params;
        const updates = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            // We create a scoped client to enforce RLS (so user 1 can't update user 2's profile)
            const scopedSupabase = require('@supabase/supabase-js').createClient(
                process.env.VITE_SUPABASE_URL,
                process.env.VITE_SUPABASE_ANON_KEY,
                { global: { headers: { Authorization: authHeader } } }
            );

            // Use upsert to create the profile if it doesn't exist, or update it if it does.
            const { data, error } = await scopedSupabase
                .from('profiles')
                .upsert({ ...updates, id })
                .select()
                .single();

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
