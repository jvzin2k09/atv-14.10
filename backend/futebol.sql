-- Banco de dados de jogadores de futebol

CREATE DATABASE IF NOT EXISTS futebol_db;
USE futebol_db;

CREATE TABLE IF NOT EXISTS times (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    cidade VARCHAR(100),
    pais VARCHAR(60) NOT NULL
);

CREATE TABLE IF NOT EXISTS jogadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    idade INT NOT NULL,
    posicao VARCHAR(30) NOT NULL,    
    numero_camisa INT,
    nacionalidade VARCHAR(60),
    gols INT DEFAULT 0,
    assistencias INT DEFAULT 0,
    time_id INT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (time_id) REFERENCES times(id) ON DELETE SET NULL
);

INSERT INTO times (nome, cidade, pais) VALUES
('Flamengo', 'Rio de Janeiro', 'Brasil'),
('Palmeiras', 'São Paulo', 'Brasil'),
('Real Madrid', 'Madrid', 'Espanha'),
('Inter Miami', 'Miami', 'Estados Unidos');

INSERT INTO jogadores (nome, idade, posicao, numero_camisa, nacionalidade, gols, assistencias, time_id) VALUES
('Pedro', 28, 'Atacante', 9, 'Brasil', 25, 5, 1),
('Arrascaeta', 31, 'Meio-campo', 10, 'Uruguai', 12, 18, 1),
('Weverton', 37, 'Goleiro', 21, 'Brasil', 0, 1, 2),
('Raphael Veiga', 30, 'Meio-campo', 23, 'Brasil', 15, 10, 2),
('Vinicius Jr', 26, 'Atacante', 7, 'Brasil', 22, 12, 3),
('Rodrygo', 25, 'Atacante', 11, 'Brasil', 14, 8, 3),
('Lionel Messi', 39, 'Atacante', 10, 'Argentina', 20, 16, 4),
('Luis Suárez', 39, 'Atacante', 9, 'Uruguai', 11, 7, 4);
