const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    db.query('SELECT nome, assistencias FROM jogadores ORDER BY assistencias DESC', (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
});


module.exports = router;
