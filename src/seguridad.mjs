import jsonwebtoken from 'jsonwebtoken';
import constantes from './constantes.mjs';

function autentico(req, res, next) {
    const tokenInfo = validoToken(req.headers.authorization);
    if (!tokenInfo.valid) {
        return res.status(401).json({ message: tokenInfo.error });
    }
    req.user = tokenInfo.decoded;
    next();
}

function autorizo(req, res, next) {
    const tokenInfo = validoToken(req.headers.authorization);
    if (!tokenInfo.valid) {
        return res.status(401).json({ message: tokenInfo.error });
    }
    const decoded = tokenInfo.decoded;
    if(decoded.superadmin){
        req.user = decoded;
        next();
    }
    else{
        return res.status(403).json({ message: 'No Autorizado' });    
    }
}

function validoToken(token) {
    if (!token || !token.startsWith('Bearer ')) {
        return { valid: false, error: 'Bearer token is required' };
    }
    try {
        const decoded = jsonwebtoken.verify(token.split(' ')[1], constantes.ENCRYPT_KEY());
        return { valid: true, decoded };
    } catch (error) {
        return { valid: false, error: 'Invalid token' };
    }
}

export default {autentico,autorizo};
