-- Table: public.usuario
CREATE TABLE IF NOT EXISTS public.usuario
(
    username character varying COLLATE pg_catalog."default" NOT NULL,
    nombre character varying COLLATE pg_catalog."default",
    password character varying COLLATE pg_catalog."default" NOT NULL,
    email character varying COLLATE pg_catalog."default" NOT NULL,
    habilitado boolean,
    superadmin boolean,
    CONSTRAINT usuario_pkey PRIMARY KEY (username)
);
--Crea usuario superadmin de password 5RT5rJ0rWc
INSERT INTO usuario (username,password,email,habilitado,superadmin) values ('superadmin','$2a$10$bnINAGbh5avhLZDJnZt0G.3HmkoPkXKl4k9BPcBvao9RX5/sPU.Da','disenatucurso@gmail.com',true,true);
-- Sequencer: public.inciadencia
CREATE SEQUENCE id_incidencia_seq;
-- Table: public.incidencia
CREATE TABLE IF NOT EXISTS public.incidencia
(
    id INTEGER DEFAULT nextval('id_incidencia_seq') NOT NULL,
    username character varying COLLATE pg_catalog."default" NOT NULL,
    titulo character varying COLLATE pg_catalog."default",
    descripcion character varying(2000) COLLATE pg_catalog."default",
    categoria character varying COLLATE pg_catalog."default",
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT incidencia_pkey PRIMARY KEY (id),
    CONSTRAINT fk_incidencia_username FOREIGN KEY (username) REFERENCES public.usuario (username)
);
-- Sequencer: public.inciadencia
CREATE SEQUENCE id_curso_seq;
-- Table: public.incidencia
CREATE TABLE IF NOT EXISTS public.curso
(
    id INTEGER DEFAULT nextval('id_curso_seq') NOT NULL,
    version INTEGER DEFAULT 1 NOT NULL,
    ruta character varying COLLATE pg_catalog."default",
    nombrecurso character varying COLLATE pg_catalog."default",
    username character varying COLLATE pg_catalog."default" NOT NULL,
    fechaactualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fechacreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT curso_pkey PRIMARY KEY (id),
    CONSTRAINT fk_curso_username FOREIGN KEY (username) REFERENCES public.usuario (username)
);
