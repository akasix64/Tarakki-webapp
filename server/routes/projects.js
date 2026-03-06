const express = require('express');

module.exports = (supabase) => {
    const router = express.Router();

    // GET all projects
    router.get('/', async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('created_at', { ascending: false });

            console.log("Fetch projects result:", data ? `Success (${data.length} records)` : "No data", "Error:", error);

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST a new project
    router.post('/', async (req, res) => {
        console.log("POST /projects request body:", req.body);
        const { title, description, location, type, budget, tags } = req.body;
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
                .from('projects')
                .insert([{ title, description, location, type, budget, tags }])
                .select()
                .single();

            if (error) throw error;
            res.status(201).json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE a project
    router.delete('/:id', async (req, res) => {
        const { id } = req.params;
        const authHeader = req.headers.authorization;

        try {
            let deleteClient = supabase;
            if (authHeader) {
                deleteClient = require('@supabase/supabase-js').createClient(
                    process.env.VITE_SUPABASE_URL,
                    process.env.VITE_SUPABASE_ANON_KEY,
                    { global: { headers: { Authorization: authHeader } } }
                );
            }

            const { error } = await deleteClient
                .from('projects')
                .delete()
                .eq('id', id);

            if (error) throw error;
            res.status(204).send(); // No content
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
