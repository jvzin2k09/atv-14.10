const express = require('express');
const app = express();
const path = require('path');
const cors = require('cors');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
    origin: '*',
    credentials: true
}));

const jogadoresRouter = require('./rotas/jogadores');
app.use('/api/jogadores', jogadoresRouter);

const golsRouter = require('./rotas/gols');
app.use('/api/gols', golsRouter);

const assistenciaRouter = require('./rotas/assistencia');
app.use('/api/assistencia', assistenciaRouter);

app.get('/', (req, res) => {
    res.send('API de futebol rodando!');
});

module.exports = app;