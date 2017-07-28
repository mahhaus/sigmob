--===========================================================================================
--                                  DADOS
--===========================================================================================

--========== USUARIO PARA TESTE
--INSERT INTO Usuario( TokenFirebase, IdMotorista, Nome, Email, Foto, Apelido, dataAtualizacao)
--VALUES( 'NTjqHAUqcnN4ESqcxf6w357IgXu2', 0, 'Josias Soares', 'josias@gmail.com', 'wrfewfwDSFDSF4efefewf', 'Josi', CURRENT_TIMESTAMP );
--INSERT INTO Usuario( TokenFirebase, IdMotorista, Nome, Email, Foto, Apelido, dataAtualizacao)
--VALUES( 'pxNQ2m98bKR62ZMl0NjV8yzW9Ro2', 0, 'Josias 8Soares', 'josias@gmail.com', 'wrfewfwDSFDSF4efefewf', 'Josi', CURRENT_TIMESTAMP );


--========== TIPOS DE EVENTOS PADRÃO
INSERT INTO TipoEvento (Codigo, Descricao, LimiteMaximo, LimiteMinimo, Icone) VALUES (1, 'Inicio de Jornada', '00:00', '00:00', 'ic_inicio.png');
INSERT INTO TipoEvento (Codigo, Descricao, LimiteMaximo, LimiteMinimo, Icone) VALUES (2, 'Direção', '00:01', '04:00', 'ic_direcao.png');
INSERT INTO TipoEvento (Codigo, Descricao, LimiteMaximo, LimiteMinimo, Icone) VALUES (3, 'Espera', '00:01', '02:00', 'ic_direcao.png');
INSERT INTO TipoEvento (Codigo, Descricao, LimiteMaximo, LimiteMinimo, Icone) VALUES (4, 'Intervalo', '01:00', '02:00', 'ic_direcao.png');
INSERT INTO TipoEvento (Codigo, Descricao, LimiteMaximo, LimiteMinimo, Icone) VALUES (5, 'Fim de Jornada', '00:00', '00:00', 'ic_direcao.png');
INSERT INTO TipoEvento (Codigo, Descricao, LimiteMaximo, LimiteMinimo, Icone) VALUES (6, 'Descanso', '00:01', '00:00', 'ic_direcao.png');

--=========== EVENTOS PADRÃO
INSERT INTO Evento(IdEmpresa, IdFilial, IdTipoEvento, Descricao, LimiteMaximo, LimiteMinimo)
VALUES(null, null, (select id from TipoEvento where Descricao = 'Inicio de Jornada'),  'Iniciar Jornada', '00:01', '00:01');

INSERT INTO Evento(IdEmpresa, IdFilial, IdTipoEvento, Descricao, LimiteMaximo, LimiteMinimo)
VALUES(null, null, (select id from TipoEvento where Descricao = 'Fim de Jornada'),  'Finalizar Jornada', '00:01', '05:00');

INSERT INTO Evento(IdEmpresa, IdFilial, IdTipoEvento, Descricao, LimiteMaximo, LimiteMinimo)
VALUES(null, null, (select id from TipoEvento where Descricao = 'Espera'),  'Espera carga/descarga', '00:01', '02:00');

INSERT INTO Evento(IdEmpresa, IdFilial, IdTipoEvento, Descricao, LimiteMaximo, LimiteMinimo)
VALUES(null, null, (select id from TipoEvento where Descricao = 'Espera'),  'Em fiscalização PF', '00:01', '02:00');

INSERT INTO Evento(IdEmpresa, IdFilial, IdTipoEvento, Descricao, LimiteMaximo, LimiteMinimo)
VALUES(null, null, (select id from TipoEvento where Descricao = 'Intervalo'),  'Intervalo para almoço', '01:00', '01:30');

INSERT INTO Evento(IdEmpresa, IdFilial, IdTipoEvento, Descricao, LimiteMaximo, LimiteMinimo)
VALUES(null, null, (select id from TipoEvento where Descricao = 'Intervalo'),  'Intervalo para janta', '01:00', '01:30');

INSERT INTO Evento(IdEmpresa, IdFilial, IdTipoEvento, Descricao, LimiteMaximo, LimiteMinimo)
VALUES(null, null, (select id from TipoEvento where Descricao = 'Direção'),  'Em direção', '00:01', '04:00');

-- =========== PREDECESSOR
INSERT INTO PREDECESSOR(IdEvento, IdTipoEvento) VALUES (2, 1);
INSERT INTO PREDECESSOR(IdEvento, IdTipoEvento) VALUES (2, 3);
INSERT INTO PREDECESSOR(IdEvento, IdTipoEvento) VALUES (2, 4);
INSERT INTO PREDECESSOR(IdEvento, IdTipoEvento) VALUES (2, 5);
INSERT INTO PREDECESSOR(IdEvento, IdTipoEvento) VALUES (3, 2);


--===========================================================================================
--                                  DDL
--===========================================================================================

--=========== EVENTO
ALTER TABLE EVENTO ADD CONSTRAINT EVENTO_TipoEvento_FK
FOREIGN KEY (IdTipoEvento) REFERENCES TipoEvento(Id);

--=========== USUARIO
ALTER TABLE USUARIO ADD CONSTRAINT USUARIO_HORARIO_FK
FOREIGN KEY (IdHorario) REFERENCES TipoEvento(Id);

--=========== PREDECESSORES
ALTER TABLE PREDECESSOR ADD CONSTRAINT PREDECESSOR_TipoEvento_FK
FOREIGN KEY (IdTipoEvento) REFERENCES TipoEvento(Id);
ALTER TABLE PREDECESSOR ADD CONSTRAINT PREDECESSOR_Evento_FK
FOREIGN KEY (IdEvento) REFERENCES Evento(Id);

--=========== APONTAMENTO_ALTER
ALTER TABLE APONTAMENTO_ALTER ADD CONSTRAINT Apontamento_Alter_Evento_FK
FOREIGN KEY (IdEvento) REFERENCES Evento(Id);
ALTER TABLE APONTAMENTO_ALTER ADD CONSTRAINT Apontamento_Alter_Jornada_Alter_FK
FOREIGN KEY (IdJornada) REFERENCES JORNADA_ALTER(Id);
ALTER TABLE APONTAMENTO_ALTER ADD CONSTRAINT Apontamento_Alter_Apto_real_FK
FOREIGN KEY (IdApontamentoReal) REFERENCES APONTAMENTO_REAL(Id);

--=========== JORNADA_ALTER
ALTER TABLE JORNADA_ALTER ADD CONSTRAINT JORNADA_ALTER_JOrn_real_FK
FOREIGN KEY (IdJornadaReal) REFERENCES JORNADA_REAL(Id);
--ALTER TABLE JORNADA_ALTER ADD CONSTRAINT JORNADA_ALTER_USUARIO_FK
--FOREIGN KEY (IdUsuario) REFERENCES USUARIO(IdAts);

--=========== APONTAMENTO_REAL
ALTER TABLE APONTAMENTO_REAL ADD CONSTRAINT Apontamento_Real_Evento_FK
FOREIGN KEY (IdEvento) REFERENCES Evento(Id);
ALTER TABLE APONTAMENTO_REAL ADD CONSTRAINT Apontamento_Real_Jornada_Alter_FK
FOREIGN KEY (IdJornada) REFERENCES Jornada_Real(Id);

--=========== JORNADA_REAL
--ALTER TABLE JORNADA_REAL ADD CONSTRAINT JORNADA_REAL_USUARIO_FK
--FOREIGN KEY (IdUsuario) REFERENCES USUARIO(IdAts)
