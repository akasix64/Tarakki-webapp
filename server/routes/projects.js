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

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // POST a new project
    router.post('/', async (req, res) => {
        const { title, description, location, type, budget, tags, deadline } = req.body;

        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([{ title, description, location, type, budget, tags, deadline }])
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
