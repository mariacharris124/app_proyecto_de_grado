const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const verifyAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No autorizado. Falta el token de acceso.' });
        }

        const token = authHeader.split(' ')[1];
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Token inválido o expirado.' });
        }

        const { data: dbUser, error: dbError } = await supabase
            .from('users')
            .select('*')
            .eq('id', user.id)
            .single();

        if (dbError || !dbUser) {
            return res.status(403).json({ error: 'El usuario no está registrado en la base de datos.' });
        }

        req.user = dbUser;
        next();
    } catch (err) {
        return res.status(500).json({ error: 'Error interno en la autenticación.' });
    }
};

module.exports = verifyAuth;