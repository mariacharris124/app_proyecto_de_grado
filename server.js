const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(cors());

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware para verificar el token de Supabase
const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ error: 'Falta el token de autorización.' });

        const token = authHeader.split(' ')[1];
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) return res.status(401).json({ error: 'Token inválido o expirado.' });

        req.user = user;
        next();
    } catch (err) {
        res.status(500).json({ error: 'Error interno al verificar el token.' });
    }
};

app.use(express.static(path.join(__dirname, 'public')));

// 1. CREAR Tutoría (POST)
app.post('/api/tutorials', verifyToken, async (req, res) => {
    try {
        const { 
            project_id, session_number, meeting_date, duration_hours, 
            topics_discussed, observations, agreements, 
            similarity_percentage, style_compliance 
        } = req.body;
        
        const { data, error } = await supabase
            .from('tutorials')
            .insert([{ 
                project_id, session_number, meeting_date, duration_hours, 
                topics_discussed, observations, agreements, 
                similarity_percentage, style_compliance 
            }])
            .select();

        if (error) {
            console.error("ERROR DE SUPABASE EN POST:", error);
            return res.status(400).json({ error: error.message });
        }
        res.status(201).json({ message: 'Tutoría registrada con éxito', data });
    } catch (err) {
        console.error("ERROR GENERAL EN POST:", err);
        res.status(400).json({ error: err.message });
    }
});

// 2. OBTENER Tutorías (GET)
app.get('/api/tutorials', verifyToken, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('tutorials')
            .select('*')
            .order('session_number', { ascending: true });

        if (error) {
            console.error("ERROR DE SUPABASE EN GET:", error);
            return res.status(400).json({ error: error.message });
        }
        res.json(data);
    } catch (err) {
        console.error("ERROR GENERAL EN GET:", err);
        res.status(400).json({ error: err.message });
    }
});

// 3. ACTUALIZAR Tutoría (PUT)
app.put('/api/tutorials/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        const { data, error } = await supabase
            .from('tutorials')
            .update(updates)
            .eq('id', id)
            .select();

        if (error) {
            console.error("ERROR DE SUPABASE EN PUT:", error);
            return res.status(400).json({ error: error.message });
        }
        res.json({ message: 'Asesoría actualizada con éxito', data });
    } catch (err) {
        console.error("ERROR GENERAL EN PUT:", err);
        res.status(400).json({ error: err.message });
    }
});

// 4. ELIMINAR Tutoría (DELETE)
app.delete('/api/tutorials/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await supabase
            .from('tutorials')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("ERROR DE SUPABASE EN DELETE:", error);
            return res.status(400).json({ error: error.message });
        }
        res.json({ message: 'Asesoría eliminada con éxito' });
    } catch (err) {
        console.error("ERROR GENERAL EN DELETE:", err);
        res.status(400).json({ error: err.message });
    }
});

// 5. FIRMAR Tutoría (PATCH)
app.patch('/api/tutorials/:id/sign', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { role_type } = req.body; // 'teacher' o 'student'

        const updateField = role_type === 'teacher' ? { teacher_signed: true } : { student_signed: true };

        const { data, error } = await supabase
            .from('tutorials')
            .update(updateField)
            .eq('id', id)
            .select();

        if (error) {
            console.error("ERROR DE SUPABASE EN SIGN:", error);
            return res.status(400).json({ error: error.message });
        }

        res.json({ message: 'Firma registrada con éxito', data });
    } catch (err) {
        console.error("ERROR GENERAL EN SIGN:", err);
        res.status(400).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor USB corriendo en http://localhost:${PORT}`));