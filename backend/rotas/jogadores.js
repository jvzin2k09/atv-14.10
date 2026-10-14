const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
    db.query('SELECT * FROM jogadores', (err, results) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.json(results);
    });
});

router.post('/', (req, res) => {
    const { nome, idade, posicao, numero_camisa, nacionalidade, gols, assistencias, time_id } = req.body;
    if (!nome || !idade || !posicao) {
        return res.status(400).json({ erro: 'nome, idade e posicao são obrigatórios' });
    }

    const sql = `INSERT INTO jogadores
        (nome, idade, posicao, numero_camisa, nacionalidade, gols, assistencias, time_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
    const valores = [nome, idade, posicao, numero_camisa || null, nacionalidade || null,
        gols || 0, assistencias || 0, time_id || null];

    db.query(sql, valores, (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        res.status(201).json({ id: result.insertId, mensagem: 'Jogador cadastrado' });
    });
});


router.put('/:id', (req, res) => {
    const { nome, idade, posicao, numero_camisa, nacionalidade, gols, assistencias, time_id } = req.body;
    if (!nome || !idade || !posicao) {
        return res.status(400).json({ erro: 'nome, idade e posicao são obrigatórios' });
    }

    const sql = `UPDATE jogadores SET
        nome = ?, idade = ?, posicao = ?, numero_camisa = ?, nacionalidade = ?,
        gols = ?, assistencias = ?, time_id = ?
        WHERE id = ?`;
    const valores = [nome, idade, posicao, numero_camisa || null, nacionalidade || null,
        gols || 0, assistencias || 0, time_id || null, req.params.id];

    db.query(sql, valores, (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ erro: 'Jogador não encontrado' });
        res.json({ mensagem: 'Jogador atualizado' });
    });
});

router.delete('/:id', (req, res) => {
    db.query('DELETE FROM jogadores WHERE id = ?', [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ erro: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ erro: 'Jogador não encontrado' });
        res.json({ mensagem: 'Jogador removido' });
    });
});

module.exports = router;
