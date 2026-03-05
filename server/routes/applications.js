const express = require('express');

module.exports = (supabase) => {
    const router = express.Router();

    // GET all applications
    router.get('/', async (req, res) => {
        try {
            // Get user's JWT
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: "Missing Authorization header" });
            }

            // Create a scoped client with the user's auth context
            const scopedSupabase = require('@supabase/supabase-js').createClient(
                process.env.VITE_SUPABASE_URL,
                process.env.VITE_SUPABASE_ANON_KEY,
                { global: { headers: { Authorization: authHeader } } }
            );

            let appsFromDb = [];
            // We'll just fetch raw directly to avoid PostgREST join errors if foreign keys aren't set
            const { data: rawApps, error } = await scopedSupabase
                .from('applications')
                .select('*')
                .order('created_at', { ascending: false });

            console.log("Raw apps fetch result from Supabase:", rawApps, "Error:", error);

            if (error) {
                console.error("Error fetching applications:", error);
                throw error;
            }

            if (rawApps && rawApps.length > 0) {
                appsFromDb = rawApps;
                // Manually join profiles and projects
                for (let app of appsFromDb) {
                    if (app.user_id) {
                        const { data: prof } = await supabase.from('profiles').select('full_name, email, role').eq('id', app.user_id).single();
                        if (prof) app.profiles = prof;
                    }
                    if (app.project_id) {
                        const { data: proj } = await supabase.from('projects').select('title').eq('id', app.project_id).single();
                        if (proj) app.projects = proj;
                    }
                }
            }

            res.json(appsFromDb);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // UPDATE application status
    router.put('/:id/status', async (req, res) => {
        const { id } = req.params;
        const { status } = req.body;
        const authHeader = req.headers.authorization;

        try {
            let updateClient = supabase;
            if (authHeader) {
                updateClient = require('@supabase/supabase-js').createClient(
                    process.env.VITE_SUPABASE_URL,
                    process.env.VITE_SUPABASE_ANON_KEY,
                    { global: { headers: { Authorization: authHeader } } }
                );
            }

            const { data, error } = await updateClient
                .from('applications')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST new application
    router.post('/', async (req, res) => {
        const { user_id, project_id, cover_letter, expected_rate, availability, status = 'pending' } = req.body;
        const authHeader = req.headers.authorization;

        try {
            let insertClient = supabase;
            if (authHeader) {
                insertClient = require('@supabase/supabase-js').createClient(
                    process.env.VITE_SUPABASE_URL,
                    process.env.VITE_SUPABASE_ANON_KEY,
                    { global: { headers: { Authorization: authHeader } } }
                );
            }

            const { data, error } = await insertClient
                .from('applications')
                .insert([{ user_id, project_id, cover_letter, expected_rate, availability, status }])
                .select()
                .single();

            if (error) throw error;
            res.status(201).json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
