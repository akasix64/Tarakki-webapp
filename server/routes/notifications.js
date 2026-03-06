const express = require('express');

module.exports = (supabase) => {
    const router = express.Router();

    // GET all notifications for a specific user
    router.get('/', async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // Verify user by auth header
            const scopedClient = require('@supabase/supabase-js').createClient(
                process.env.VITE_SUPABASE_URL,
                process.env.VITE_SUPABASE_ANON_KEY,
                { global: { headers: { Authorization: authHeader } } }
            );

            // Fetch current user from session token
            const { data: { user }, error: authError } = await scopedClient.auth.getUser();
            if (authError || !user) {
                return res.status(401).json({ error: "Invalid Token" });
            }

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            res.json(data);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // PUT to mark all notifications as read for current user
    router.put('/read-all', async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

            const scopedClient = require('@supabase/supabase-js').createClient(
                process.env.VITE_SUPABASE_URL,
                process.env.VITE_SUPABASE_ANON_KEY,
                { global: { headers: { Authorization: authHeader } } }
            );

            const { data: { user } } = await scopedClient.auth.getUser();
            if (!user) return res.status(401).json({ error: "Invalid Token" });

            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;
            res.json({ success: true, message: "Marked all as read" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    // DELETE all notifications for the current user
    router.delete('/clear-all', async (req, res) => {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) return res.status(401).json({ error: "Unauthorized" });

            const scopedClient = require('@supabase/supabase-js').createClient(
                process.env.VITE_SUPABASE_URL,
                process.env.VITE_SUPABASE_ANON_KEY,
                { global: { headers: { Authorization: authHeader } } }
            );

            const { data: { user } } = await scopedClient.auth.getUser();
            if (!user) return res.status(401).json({ error: "Invalid Token" });

            const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
            res.json({ success: true, message: "Cleared all notifications" });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return router;
};
