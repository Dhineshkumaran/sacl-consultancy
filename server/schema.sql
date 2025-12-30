USE SACL;
GO
CREATE TABLE master_card (
    id INT NOT NULL IDENTITY(1,1),
    pattern_code VARCHAR(150) NOT NULL,
    part_name VARCHAR(200) NOT NULL,
    material_grade VARCHAR(100),
    chemical_composition NVARCHAR(MAX),
    micro_structure NVARCHAR(MAX),
    tensile NVARCHAR(MAX),
    impact NVARCHAR(MAX),
    hardness NVARCHAR(MAX),
    xray NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETDATE(),
    PRIMARY KEY (id),
    CONSTRAINT ux_pattern_code UNIQUE (pattern_code)
);
GO

INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('FIA-S-011-B0-20-P-01-00','H6 FRONT KNUCKLE','FCD 590/7','C : 3.40 - 3.80% Si : 2.20 - 2.70% Mn : 0.30 - 0.60% P : 0.030 - 0.050% S : 0.015% Max Mg : 0.030 - 0.060% Cu : 0.30% Min','Spheroidization 90% min Pearlite – Ferrite Cementite : ≤5%','590 N/mm² Min. 370 N/mm² Min. ≥7%','--','190 – 250 BHN 10mm Ball / 3000 Kgs load','Type A - Gas porosity : Level 2 Type B - Sand and Slag inclusions : Level 2 Type C - Shrinkage : Level 2 Type D,E,F (Crack, Hot tear & Insert) : Not allowed');
INSERT INTO master_card 
(pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) 
VALUES 
('FIA-S-013-B0-20-P-01-00',
'H6 REAR KNUCKLE',
'FCD 590/7',
'C : 3.40 - 3.80% Si : 2.20 - 2.70% Mn : 0.30 - 0.60% P : 0.030 - 0.050% S : 0.015% Max Mg : 0.030 - 0.060% Cu : 0.30% Min',
'Spheroidization 90% min Pearlite - Ferrite Cementite : <=5%',
'590 N/mm2 Min. 370 N/mm2 Min. >=7%',
'--',
'190 - 250 BHN 10mm Ball / 3000 Kgs load',
'Type A - Gas porosity : Level 2 Type B - Sand and Slag inclusions : Level 2 Type C - Shrinkage : Level 2 Type D,E,F (Crack, Hot tear and Insert) : Not allowed');

INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('GMI-S-048-B0-20-P-03-00','KNUCKLE STRG L/R - M2XX (3rd SET)','FCD 450/12','C : 3.30 - 3.90% Si : 2.70% Max (As per Drawing) Mn : 0.70% Max P : 0.05% Max S : 0.02% Max Cu : 0.50% Max Cr : 0.10% Max Mg : 0.030 - 0.050%','Spheroidal Graphite - 80 % Min (Form V or VI as per ISO 945) Pearlite 30% Max (40% in agreed upon isolated areas only) Carbide <1% in all locations','450 Mpa Min 310 Mpa Min. 12% Min.','--','156 - 197 BHN','Level II Max');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('HON-S-039-B0-20-P-01-00','KNUCKLE R/L, FR (20M)','FCD 550/10','C: 3.50 - 3.70% Si : 2.30 - 2.60% Mn : 0.20~0.35% P : 0.050 % Max S : 0.010 % Max Mg : 0.035 - 0.060 % Cu : 0.30 - 0.50% Cr : 0.050 % Max','≥ 70% Ferrite Rate : ≥ 25 % Chill and inverse chill shall not be formed','≥ 550 Mpa ≥ 330MPa ≥ 10%','≥ 70 J/Cm2','Surface hardness: 174-241 BHN Cross-section hardness: 86 - 98 HRB','Level 2 defect maximum');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('HON-S-043-B0-20-P-01-00','KNUCKLE R/L FR (31XA)','FCD 480/10','C: 3.50-3.70% Si : 2.45 - 2.65% Mn : 0.35% Max P : 0.05% Max S : 0.010% Max Mg : 0.030% Min Cu : 0.50% Max Cr : 0.050% Max','≥70% ≥30% Ferrite (Include Cu), chill and Inverse Chill shall not be formed.','≥480 Mpa ≥310 Mpa ≥10%','≥60 J/Cm2','Surface hardness: 152 to 217 HB Cross-section hardness: 81 to 94 HRB','Level 2 defect maximum');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('HON-S-047-B0-20-P-01-00','3DPA KNUCKLE R/L FR','FCD 550/10','C: 3.50-3.70% Si : 2.30 - 2.60% Mn : 0.20-0.35% P : 0.050% Max S : 0.010% Max Mg : 0.035 - 0.060% Cu : 0.20-0.50% Cr : 0.05% Max','Graphite spheroidizing rate : ≥70% Ferrite rate : ≥25% Chill formation : Chill and inverse chill shall not be formed.','≥550 Mpa ≥330 Mpa ≥10%','≥ 70 J/Cm2','Surface hardness: 174 to 241 HB Cross-section hardness: 86 to 98 HRB','Level 2 defect maximum');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('ILJ-S-074-B0-20-P-06-00','SP2i KNUCKLE LH / RH - (SF9)','FCD 500/7','C: 3.00 - 4.00% Si: 2.50 - 3.20% Mn: 0.20 - 0.60% P:0.05% Max S: 0.05% Max Ni : 1.0% Max Mg : 0.015% Min','Graphite formation: 80% Min Graphite size 60 µm Max Ferrite + Pearlite (Ferrite, Max 50% ) Free Cementite max 5%','Tensile Strength : 500 Mpa min Yield Strength : 350 Mpa min Elongation : 7 % Min','--','170-241 HB','casting without any castings defects such as cold shut, blow holes, Pull cracks, Shrinkage cavities etc.');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('ILJ-S-076-B0-20-P-01-00','KNUCKLE-FR. LH/RH (AC3)','FCD 500/7','C: 3.00 - 4.00% Si: 2.50 - 3.20% Mn: 0.20 - 0.60% P:0.05% Max S: 0.05% Max Ni : 1.0% Max Mg : 0.015% Min','Graphite formation: 80% Min Graphite size 60 µm Max Ferrite + Pearlite (Ferrite, Max 50% ) Free Cementite max 5%','Tensile Strength : 500 Mpa min Yield Strength : 350 Mpa min Elongation : 7 % Min','--','170-241 HB','casting without any castings defects such as cold shut, blow holes, Pull cracks, Shrinkage cavities etc.');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('MAH-G-007-A0-20-P-01-00','BOLERO DISC (DISA-4)','FC 220','C: 3.40 - 3.65% Si: 1.60 - 2.10% Mn : 0.60 – 1.50% P : 0.15 % Max S : 0.12 % Max Cu : 0.60% Max Cr : 0.30% Max Sn : 0.050% Max','Graphite distribution: Graphite form VII (Flake) With Type ''A'' Type distribution, Size: 3 - 5 Predominently pearlite, Ferrite < 5% , Carbide < 5%','220 N/mm2 Min','--','170 – 241 HB','--');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('MAH-S-032-B0-20-P-03-00','S201 - ECO KNUCKLE - (SF3)','FCD 600/3','C : 3.40 - 3.80% Si : 2.00 - 2.80% Mn : 0.40% Max S : 0.020% Max P : 0.050% Max Cu : 0.60% Max Sn : 0.05% Max','Graphite Spheroidization: 80% or over Form type V and VI (ISO 945) Pearlite+Ferrite (Pearlite 50% Min Carbide lower than 3%','600 Mpa Min 370 Mpa Min 3% Minimum','--','190 - 270 BHN','The acceptance criteria defaults to level 2 as per ASTM Strut bracket arm - Level - I Lower Ball joint arm junctions - Level - I Tie Rod Arm junctions - Level - I Other Non - Critical areas Max Level - 2 defect may be permitted');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('MAH-S-046-B0-20-P-01-00','W601 FRONT KNUCKLE','FCD 450/10','C : 3.20 – 4.10% Si : 1.80 - 3.00% Mn : 0.10 - 1.0% P  : 0.050% Max S  : 0.030% Max Mg : 0.030 – 0.060% Cr : 0.10% Max Cu : 0.50% Max','Spheroidal Graphite: 90% Min Form V & VI Graphite Nodule size class 5 or Finer Nodule Count : 100pcs/mm2 Minimum Predominently Ferrite Carbide Content should not exceed 3%','450 Mpa Minimum 310 Mpa Minimum 10% Minimum','--','170 - 210 BHN','Acceptance criteria: Max level 1 in critical sections (Strut arm, tie rod arm, lower ball joint arm, brake caliper mounting arm & Hub Assy Mounting) Other non-critical sections max. level 2 shall be permissible.');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('MAI-S-002-B0-20-P-01-00','HUB IDLER GEAR (2014)','FCD 500/7','C – 3.20-4.00 % Si : 1.50 – 2.80 % Mn – 0.05-1.0 % Mg – 0.030-0.080% S – 0.020% Max P - 0.080% Max Cu: 0.50% Max','80% Min Predominently Pearlite – Ferritic 1% Cementite Max Shape ASTM A247-67 I & II','500 – 700 N/mm2 320 – 440 N/mm2 7 – 17%','--','170 - 230 HB','--');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('MAR-G-047-A0-20-P-04-00','YG8 DRUM (DISA-4)','FC 250A','C : 3.20 – 3.65% Si: 1.95 - 2.35% Mn : 0.60- 0.90% S : 0.10% Max P : 0.10%Max Cr : 0.30 % Max Cu : 0.70 % Max','Type A + Type B (Type B : less than 20%) Size : 3 to 6 Ferrite 5% or less','260 MPa (or) more','--','165 - 228 BHN','--');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('MAR-G-048-A0-20-P-01-00','MODEL-C-DISC (4C) - DISA-4','FC 250A','C : 3.20 – 3.65% Si : 1.95 – 2.35% Mn : 0.60- 0.90% S : 0.10% Max P : 0.15%Max','Graphite Type Type ''A + B'' (Type B : Less than 20%) Size : 3-6 Matrix: Ferrite 5% or less','26 Kgf/mm2 or More','--','165 – 228 BHN','--');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('MAR-S-071-B0-20-P-04-00','YP8 KNUCKLE STEERING - 4P (ABS)','FCD 500/10','C : 3.40 - 4.20% Si : 1.80 - 2.70% Mn : 0.50% or Less Cu : 0.10 – 0.50% Sn : 0.02% or Less S :0.03% or Less','80% min Nodule Count : 70pcs/mm2 Min Pearlite : 10-40%','500 MPa Min 320 MPa Min 340 Mpa Min 10% Min','--','164 - 188 BHN','Ø2mm Max On Strut Bracket Arm and Stud arm Junction');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('MYU-S-019-B0-20-P-01-00','KNUCKLE - LH/RH (QY)','FCD 500/7','C: 3.00 - 4.00% Si: 2.50 - 3.20% Mn: 0.20 - 0.60% P:0.05% Max S: 0.05% Max Ni : 1.0% Max Mg : 0.015% Min','Graphite formation: Nodularity 80% Min Graphite size: 60 µm Max Ferrite + Pearlite (Ferrite, Max 50% ) Carbide: 5% max','Tensile Strength : 500 Mpa min Yield Strength : 350 Mpa min Elongation : 7 % Min','--','170-241 HB','Casting quality shall be homogeneous throughout Castings without any casting defects such as cold shut, blow holes, Pull cracks, Shrinkage cavities etc.');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('MYU-S-025-B0-20-P-02-00','KY - EV KNUCKLE (ECN)','FCD 500/7','C: 3.00 - 4.00% Si: 2.50 - 3.20% Mn: 0.20 - 0.60% P:0.05% Max S: 0.05% Max Ni : 1.0% Max Mg : 0.015% Min','Graphite formation: Nodularity 80% Min Graphite size: 60 µm Max Ferrite + Pearlite (Ferrite, Max 50% ) Carbide: 5% max','Tensile Strength : 500 Mpa min Yield Strength : 350 Mpa min Elongation : 7 % Min','--','170-241 HB','Casting quality shall be homogeneous throughout Castings without any casting defects such as cold shut, blow holes, Pull cracks, Shrinkage cavities etc.');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('NAL-G-006-B0-20-P-01-00','DISC - FR BRAKE (DOST PLUS)','', 'C: 3.40 % Min Si: 1.50 -2.00% Mn : 0.60 – 0.90% P : 0.15 % Max S : 0.12 % Max Cu : 0.30 - 0.50% Cr : 0.15 - 0.30%','Graphite distribution: Graphite form 1 , Predominently Type ''A'' distribution Type D & E Little Quantity Size: 3 – 5 Matrix: Lameller Pearlite Ferrite 5% Max on Braking Surface','--','--','180 - 230 HB','--');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('NAL-G-007-A0-20-P-01-00','DOST LITE FLYWHEEL (DISA-4)','FC 200','C  : 3.00 - 3.40% Si : 1.70 - 2.20% Mn : 0.60 - 0.90% Cu : 0.40 - 0.70% Cr : 0.20 - 0.50% S : 0.10% Max P : 0.20% Max','Flake Graphite corresponding to Form I ( Predominentaly Type A ) (As per ISO 945.) Free from Chill','200 N/mm2','--','207 - 241 BHN','Imperfections having a level less than or equal to 2 are permitted.');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('NIS-S-001-B0-20-P-02-00','NISSIN BRACKET (6CAV)','FCD 450/10','C : 3.50 – 3.75% Si : 2.50 – 2.75% Mn : 0.30% Max S : 0.02% Max P : 0.05% Max Cu : 0.25% Max Mg : 0.060% Max','80% Min Ferrite : 70% Min Free from Chill and Cementite','450 N/mm2 Min. 280 N/mm2 Min 10%','--','140 – 210 HB','--');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('NIS-S-002-B0-20-P-02-00','NISSIN CALIPER BODY','FCD 450/10','C : 3.50 – 3.75% Si : 2.50 – 2.75% Mn : 0.30% Max S : 0.02% Max P : 0.05% Max Cu : 0.25% Max Mg : 0.060% Max','80% Min Ferrite : 70% Min Free from Chill and Cementite','450 N/mm2 Min. 280 N/mm2 Min 10%','--','140 – 210 HB','--');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('PEU-S-001-B0-20-P-05-00','PIVOT SUSPENSION - RH / LH (78 BERLIN) - NEW','FCD 400/12','C: 3.40 – 3.80% Si : 2.30 – 3.00% Mn: ≤0.70% S: ≤0.02% P: ≤0.05%','Graphite Spheroidization : Shape VI AB≥85%; CDE Type F Prohibited (2) Matrix: Ferrite ≥75%; Free carbide ≤2%','≥400 MPa ≥ 250 MPa ≥12%','--','156 - 197 HB','Level 2 maximum');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('PEU-S-003-B0-20-P-03-00','PIVOT SUSPENSION RH / LH (PIVOT 68) - NEW','FCD 400/12','C: 3.40 – 3.80% Si : 2.30 – 3.00% Mn: ≤0.70% S: ≤0.02% P: ≤0.05%','Graphite Spheroidization : Shape VI AB≥85%; CDE Type F Prohibited (2) Matrix: Ferrite ≥75%; Free carbide ≤2%','≥400 MPa ≥ 250 MPa ≥12%','--','156 - 197 HB','Level 2 maximum');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('REN-G-023-A0-20-P-01-00','DISK FR BRAKE - Ø280 (X1324) - DISA - 4','FC 150','C :3.30 - 3.90% Si : 1.80 - 2.80% Mn : 0.50-0.90% P : <0.10% S :<0.15% Cr: <0.25% Sn: <0.10% Cu: <0.80% Ni: <0.20% Mo: <0.10%','Graphite formation : IA 3-4 ≥ 80%, C Prohibited Brake bond area: refer to cast iron standard GDN-0221-2024-0002 and B < 10% and D+E < 5% Other areas: IA3-4 ≥ 60% - 2A < 10% - B < 10%, - D +E < 5% - C prohibited. Matrix: Ferrite <5%; Carbide <5%','≥ 150 Mpa','--','166-223 HB','Imperfections having a level less than or equal to 2 are permitted.');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('REN-G-025-A0-20-P-01-00','DRUM - RR (X1324) - DISA - 4','FC 200','C:3.10 - 3.50% Si: 1.80 – 2.50% Mn : 0.50 – 0.90% S : < 0.20 % P : < 0.12 % Cr: < 0.35% Cu : < 0.80% Sn : < 0.15% Mo :< 0.10%','Graphite formation : IA 4 - 5 ≥80% B<10%, D+E<5% (As per std 02-21-000/--G) C - Prohibited . Ferrite <5% Cementite <5%','> 200 Mpa','--','187 – 241 HB','Imperfections having a level less than or equal to 2 are permitted.');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('REN-S-021-B0-20-P-01-00','KNU-STRG, FR LH / RH (X1324)','FCD 450/12','C : 3.30 - 3.80% Si: 2.40 - 3.30% Mn: <0.50% P: <0.050% S: <0.020% Sn: <0.010% Cu : <0.20%','Graphite formation: V-VI >85%, III-IV <15%, I-II Prohobited Size: ≥5 Matrix: Pearlite <25%; Carbide <2%','≥ 450Mpa ≥ 310MPa ≥ 12%','KV Min > 2 J (''V'' Notch) KV Average > 3 J','160-210 HB','Imperfections having a level less than or equal to 2 are permitted.');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('SON-G-001-A0-20-P-03-00','VAN REAR DRUM (DISA-4)','FC 250','C: 3.25 - 3.40% Si: 1.90 - 2.00% Mn : 0.60 - 0.80% P : 0.10% Max S : 0.060 – 0.080% Cr : 0.15 - 0.30% Cu : 0.40 – 0.50 %','Predominently Type ''A'' With little quantity of D & E Size : 3 to 5 Ferrite less than 5%','250 N/mm2 Min','--','170 - 241 BHN','--');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('SON-S-005-B0-20-P-01-00','IDLER BOX CASTING','FCD 450/10','C  : 3.50 – 3.80 % Si : 2.50 – 2.80 % Mn : 0.40% Max S: 0.020% Max P : 0.05% Max Mg: 0.035-0.060%','Spheroidization 80% min From V & VI Predominently Ferrite','450 Mpa Min 310 Mpa Min 10 % Minimum','--','160 – 210 HB','--');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('STE-S-001-B0-20-P-02-00','CC21E KNUCKLE (2CAV)','FCD 590/7','C: 3.40-3.80% Si: 2.20-2.70% Mn: 0.30-0.60% S: 0.015%Max P: 0.030-0.050% Cu: 0.40-1.0% Mg: 0.030-0.060%','Spheroidal Graphite Nodularity: 90% Min Type: I and II Size: 5 to 7 As per ASTM A247 Pearlite - Ferrite structure .No more than 5% cementite.','590 N/mm2 Min 370 N/mm2 Min ≥7%','--','190-250 HB','Safety and Critical castings (As per STD ASTM E446) Type A - Gas porosity : Level 2 Type B - Sand and Slag inclusions : Level 2 Type C - Shrinkage : Level 2 Type D,E,F (Crack, Hot tear & Insert) : Not allowed');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('STE-S-005-B0-20-P-01-00','O2K KNUCKLE','FCD 400/12','C: 3.40 – 3.80% Si : 2.30 – 3.00% Mn: ≤0.70% S: ≤0.02% P: ≤0.05%','Graphite Spheroidization : Shape VI AB≥85%; CDE Type F Prohibited Matrix: Ferrite ≥75%; Free carbide ≤2%','Tensile Strength : ≥400 Mpa Yield Strength : ≥ 250 Mpa Elongation : ≥12%','--','156 - 197 HB','Level 2 maximum');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('STE-S-007-B0-20-P-01-00','FRONT KNUCKLE - LH/RH (J4U - NA BEV ON-ROAD)','FCD 420/12','C: 3.40 – 3.80% Si : 2.30 - 2.80% Mn: ≤0.30% S: ≤0.02% P: ≤0.050% Ceq: ≤4.60%','Graphite Spheroidization : Form VI AB≥90%; CDE Type F Prohibited Matrix:Ferrite ≥75%; Free carbide ≤2%','≥420 MPa ≥ 275 MPa ≥12%','≥12 J/cm2 @ Room Temperature','156 - 197 HB','Level 2 maximum');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('VOL-S-070-B0-20-P-01-00','7339 BRACKET','FCD 500/7','C : 3.20-4.00% Si : 1.50-2.80% Mn : 0.05-1.00% P : 0.08% Max S : 0.02% Max Cu : 0.0 – 0.50% Mg : 0.030-0.080%','80% Min (Shape I or II As per ASTM A247-67) Pearlitic - ferritic Carbide – Not Exceed 1%','500 N/mm2 Min 320 N/mm2 Min 7% Min','--','170 - 230 HB','0.2 X Thickness');
INSERT INTO master_card (pattern_code, part_name, material_grade, chemical_composition, micro_structure, tensile, impact, hardness, xray) VALUES ('VWN-S-005-B0-20-P-02-00','STEERING KNUCKLE (VOLKSWAGEN) (C - REV)','FCD 550/8','C : 3.30-4.10% Si : 2.00-3.00% Mn : 0.1-0.80% P  : 0.080% Max S  : 0.03% Max Mg : 0.010-0.060% Cu : 0.2-0.60%','Spheroidal Graphite: 80% Min Graphite form: Shape V + VI as per ISO 945-1 Ferrite - Pearlite','>550 N/mm2 >340 N/mm2 8% Min','Absorbed impact energy AV t.b.d -300c (Unnotched)','180 – 240 HBW','Area 1 (Strength –Critical areas): No flaws >1.0 mm in diameter are permissible Area 2 (Remaining areas): a) Maximum individual flaw size is 2.0mm b) Maximum permissible flaw density is 5% of the observation field');
SELECT * FROM master_card;

CREATE TABLE trial_cards (
    trial_id NVARCHAR(255) PRIMARY KEY,
    part_name VARCHAR(100) NOT NULL,
    pattern_code VARCHAR(50) NOT NULL,
    material_grade VARCHAR(50) NOT NULL,
    initiated_by VARCHAR(50) NOT NULL,
    date_of_sampling DATE NOT NULL,
    no_of_moulds INT CHECK (no_of_moulds > 0),
    reason_for_sampling NVARCHAR(MAX),
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    tooling_modification NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    current_department_id INT,
    disa VARCHAR(50),
    sample_traceability VARCHAR(50),
    mould_correction NVARCHAR(MAX),
    CONSTRAINT chk_trial_status CHECK (status IN ('CREATED', 'IN_PROGRESS', 'CLOSED')),
    FOREIGN KEY (current_department_id) REFERENCES departments(department_id)
);
GO

CREATE INDEX idx_trial_pattern_code ON trial_cards(pattern_code);
CREATE INDEX idx_trial_status ON trial_cards(status);
CREATE INDEX idx_trial_department ON trial_cards(current_department_id);
GO

CREATE TABLE mechanical_properties (
    trial_id NVARCHAR(255) PRIMARY KEY,
    tensile_strength NVARCHAR(MAX),
    yield_strength NVARCHAR(MAX),
    elongation NVARCHAR(MAX),
    impact_strength_cold NVARCHAR(MAX),
    impact_strength_room NVARCHAR(MAX),
    hardness_surface NVARCHAR(MAX),
    hardness_core NVARCHAR(MAX),
    x_ray_inspection NVARCHAR(MAX),
    mpi NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE
);
GO

CREATE TABLE metallurgical_specifications (
    trial_id NVARCHAR(255) PRIMARY KEY,
    chemical_composition NVARCHAR(MAX),
    microstructure NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE
);
GO

CREATE TABLE material_correction (
    trial_id NVARCHAR(255) PRIMARY KEY,
    chemical_composition NVARCHAR(MAX),
    process_parameters NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE
);
GO

CREATE TABLE pouring_details (
    trial_id NVARCHAR(255) PRIMARY KEY,
    pour_date DATE NOT NULL,
    heat_code NVARCHAR(MAX),
    composition NVARCHAR(MAX),
    pouring_temp_c DECIMAL(6,2) CHECK (pouring_temp_c > 0),
    pouring_time_sec INT CHECK (pouring_time_sec > 0),
    inoculation NVARCHAR(MAX),
    other_remarks NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE
);
GO

CREATE TABLE sand_properties (
    trial_id NVARCHAR(255) PRIMARY KEY,
    date DATE NOT NULL,
    t_clay DECIMAL(6,3) CHECK (t_clay >= 0),
    a_clay DECIMAL(6,3) CHECK (a_clay >= 0),
    vcm DECIMAL(6,3) CHECK (vcm >= 0),
    loi DECIMAL(6,3) CHECK (loi >= 0),
    afs DECIMAL(6,3) CHECK (afs >= 0),
    gcs DECIMAL(6,3) CHECK (gcs >= 0),
    moi DECIMAL(6,3) CHECK (moi >= 0),
    compactability DECIMAL(6,3) CHECK (compactability >= 0),
    permeability DECIMAL(6,3) CHECK (permeability >= 0),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE
);
GO

CREATE TABLE mould_correction (
    trial_id NVARCHAR(255) PRIMARY KEY,
    mould_thickness VARCHAR(30),
    compressability VARCHAR(30),
    squeeze_pressure VARCHAR(30),
    mould_hardness VARCHAR(30),
    remarks NVARCHAR(MAX),
    date DATE NOT NULL,
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE
);
GO

CREATE TABLE metallurgical_inspection (
    trial_id NVARCHAR(255) PRIMARY KEY,
    inspection_date DATE NOT NULL,
    micro_structure NVARCHAR(MAX),
    micro_structure_ok BIT,
    micro_structure_remarks NVARCHAR(MAX),
    mech_properties NVARCHAR(MAX),
    mech_properties_ok BIT,
    mech_properties_remarks NVARCHAR(MAX),
    impact_strength NVARCHAR(MAX),
    impact_strength_ok BIT,
    impact_strength_remarks NVARCHAR(MAX),
    hardness NVARCHAR(MAX),
    hardness_ok BIT,
    hardness_remarks NVARCHAR(MAX),
    ndt_inspection NVARCHAR(MAX),
    ndt_inspection_ok BIT,
    ndt_inspection_remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE
);
GO

CREATE TABLE visual_inspection (
    trial_id NVARCHAR(255) PRIMARY KEY,
    inspections NVARCHAR(MAX),
    visual_ok BIT NOT NULL,
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE
);
GO

CREATE TABLE dimensional_inspection (
    trial_id NVARCHAR(255) PRIMARY KEY,
    inspection_date DATE NOT NULL,
    casting_weight INT CHECK (casting_weight > 0),
    bunch_weight INT CHECK (bunch_weight > 0),
    no_of_cavities INT CHECK (no_of_cavities > 0),
    yields INT CHECK (yields >= 0),
    inspections NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE
);
GO

CREATE TABLE machine_shop (
    trial_id NVARCHAR(255) PRIMARY KEY,
    inspection_date DATE NOT NULL,
    inspections NVARCHAR(MAX),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE
);
GO

CREATE TABLE department_progress (
    trial_id NVARCHAR(255) NOT NULL,
    department_id INT NOT NULL,
    username VARCHAR(50) NOT NULL,
    completed_at DATETIME2 DEFAULT GETDATE(),
    current_form VARCHAR(50) NOT NULL,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    remarks NVARCHAR(MAX),
    CONSTRAINT chk_approval_status CHECK (approval_status IN ('pending', 'approved')),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id),
    FOREIGN KEY (username) REFERENCES users(username)
);
GO

CREATE INDEX idx_dept_progress_trial ON department_progress(trial_id, department_id);
CREATE INDEX idx_dept_progress_status ON department_progress(approval_status);
GO

CREATE TABLE documents (
    document_id INT IDENTITY(1,1) PRIMARY KEY,
    trial_id NVARCHAR(255) NOT NULL,
    document_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_base64 NVARCHAR(MAX),
    uploaded_by BIGINT,
    uploaded_at DATETIME2 DEFAULT GETDATE(),
    remarks NVARCHAR(MAX),
    FOREIGN KEY (trial_id) REFERENCES trial_cards(trial_id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(user_id)
);
GO

CREATE INDEX idx_documents_trial ON documents(trial_id);
CREATE INDEX idx_documents_type ON documents(document_type);
GO

CREATE TABLE users (
    user_id BIGINT NOT NULL IDENTITY(1,1),
    username VARCHAR(50) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    department_id INT DEFAULT NULL,
    role VARCHAR(20) NOT NULL,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 NULL DEFAULT GETDATE(),
    last_login DATETIME2 NULL DEFAULT NULL,
    remarks NVARCHAR(MAX),
    PRIMARY KEY (user_id),
    CONSTRAINT ux_username UNIQUE (username),
    CONSTRAINT ux_email UNIQUE (email),
    CONSTRAINT users_chk_1 CHECK (role IN ('User','HOD','Admin')),
    FOREIGN KEY (department_id) REFERENCES departments(department_id)
);
GO

CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
GO

CREATE TABLE email_otps (
    otp_id BIGINT NOT NULL IDENTITY(1,1),
    user_id BIGINT DEFAULT NULL,
    email NVARCHAR(255) NOT NULL,
    otp_code NVARCHAR(10) NOT NULL,
    attempts TINYINT NOT NULL DEFAULT 0,
    used BIT NOT NULL DEFAULT 0,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    PRIMARY KEY (otp_id),
    CONSTRAINT chk_otp_attempts CHECK (attempts >= 0 AND attempts <= 10),
    CONSTRAINT fk_emailotps_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);
GO

CREATE INDEX idx_user_email ON email_otps(user_id, email);
CREATE INDEX idx_email ON email_otps(email);
CREATE INDEX idx_expires_at ON email_otps(expires_at);
GO

CREATE TABLE departments (
    department_id INT IDENTITY(1,1) PRIMARY KEY,
    department_name VARCHAR(50) UNIQUE NOT NULL
);
GO

INSERT INTO departments(department_name) VALUES
('ADMIN'),
('NPD METHODS'),
('NPD QC'),
('SANDPLANT'),
('FETTLING'),
('VISUAL INSPECTION'),
('MOULDING'),
('QUALITY'),
('MACHINESHOP'),
('NDT QC'),
('QA'),
('CUSTOMER');
GO

CREATE TABLE audit_log (
    audit_id BIGINT NOT NULL IDENTITY(1,1),
    user_id INT DEFAULT NULL,
    trial_id NVARCHAR(255) DEFAULT NULL,
    department_id INT DEFAULT NULL,
    action VARCHAR(100) NOT NULL,
    action_timestamp DATETIME2 NULL DEFAULT GETDATE(),
    remarks NVARCHAR(MAX),
    PRIMARY KEY (audit_id)
);
GO

CREATE INDEX idx_audit_trial ON audit_log(trial_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_timestamp ON audit_log(action_timestamp);
CREATE INDEX idx_audit_trial_timestamp ON audit_log(trial_id, action_timestamp);
GO