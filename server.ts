import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Initial seed data
const initialData = {
  reports: [
    {
      id: "rel_0038",
      code: "#0038",
      date: new Date().toISOString().split('T')[0],
      status: "Finalizado",
      client: {
        id: "cli_1",
        name: "Indústria Metalúrgica Alvorada",
        document: "12.345.678/0001-90",
        phone: "(11) 98765-4321",
        address: "Rua das Indústrias, 450 - Galpão 3",
        contactPerson: "Eng. Marcos Rocha"
      },
      machine: {
        id: "maq_1",
        name: "Prensa Hidráulica 200T",
        model: "PH-200 Heavy Duty",
        serialNumber: "SN-98421-2022",
        tag: "MQ-01",
        horometer: "4.850h",
        location: "Setor de Estamparia A",
        manufacturer: "Schuler Press"
      },
      technician: {
        id: "tec_1",
        name: "Carlos Eduardo (Kadu)",
        phone: "(11) 99123-4567",
        role: "Técnico Responsável"
      },
      assistants: ["Lucas Silva", "Rodrigo Mendes"],
      times: {
        date: new Date().toISOString().split('T')[0],
        startTime: "08:30",
        endTime: "13:15"
      },
      maintenanceType: "Preventiva",
      equipmentStatus: "Operacional",
      description: "Revisão geral semestral do sistema hidráulico e elétrico. Substituição do conjunto de filtros de retorno e óleo ISO VG 68. Limpeza dos drenos, reaperto do barramento de comando e teste de pressão estática atingindo 210 bar sem variações anormais.",
      partsReplaced: "Filtro de retorno Parker Mod. 40R, Anéis de vedação O-Ring Viton 90 shore, 45L Óleo Hidráulico ISO VG 68.",
      checklist: [
        { id: "c1", label: "Inspeção visual geral e vazamentos", status: "conforme", notes: "Sem vazamentos ativos" },
        { id: "c2", label: "Nível e estado do óleo lubrificante", status: "conforme", notes: "Óleo renovado" },
        { id: "c3", label: "Limpeza e desobstrução de filtros", status: "conforme", notes: "Filtros trocados" },
        { id: "c4", label: "Tensão e alinhamento de correias/acoplamentos", status: "conforme", notes: "Alinhado a laser" },
        { id: "c5", label: "Aperto de parafusos e bases estruturais", status: "conforme", notes: "Torque verificado" },
        { id: "c6", label: "Fiação, bornes e painel elétrico", status: "conforme", notes: "Termografia ok" },
        { id: "c7", label: "Ruídos e vibrações anômalas", status: "conforme", notes: "Ruído dentro do padrão" },
        { id: "c8", label: "Cortinas de luz e botões de emergência", status: "conforme", notes: "Parada imediata testada" },
        { id: "c9", label: "Pressão hidráulica/pneumática de trabalho", status: "conforme", notes: "Pressão 210 bar estável" },
        { id: "c10", label: "Teste final de ciclo operacional", status: "conforme", notes: "10 ciclos operacionais 100%" }
      ],
      photosBefore: [
        {
          id: "pb_1",
          url: "/src/assets/images/industrial_machinery_1790525107437.jpg",
          caption: "Conjunto hidráulico e cilindro principal antes da intervenção",
          timestamp: "08:45"
        }
      ],
      photosAfter: [
        {
          id: "pa_1",
          url: "/src/assets/images/industrial_machinery_1790525107437.jpg",
          caption: "Equipamento revisado, lubrificado e limpo em teste final",
          timestamp: "13:00"
        }
      ],
      observations: "Máquina liberada para produção contínua. Próxima intervenção preventiva programada para 180 dias ou 5.500 horas.",
      futureRecommendations: "Monitorar temperatura da válvula proporcional do bloco principal após 200 horas de operação.",
      signatures: {
        technician: {
          name: "Carlos Eduardo (Kadu)",
          signatureImage: "",
          date: new Date().toISOString().split('T')[0]
        },
        clientResponsible: {
          name: "Eng. Marcos Rocha",
          document: "CREA 506.912/SP",
          signatureImage: "",
          date: new Date().toISOString().split('T')[0]
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  machines: [
    {
      id: "maq_p1_01",
      name: "INJ. 01 - STARMACH 55",
      model: "STARMACH 55",
      tonnage: "55 t",
      pavilhao: "P1",
      tag: "INJ. 01",
      manufacturer: "Starmach",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_02",
      name: "INJ. 02 - MINGPLAST 45 S-7",
      model: "MINGPLAST 45 S-7",
      tonnage: "45 t",
      pavilhao: "P1",
      tag: "INJ. 02",
      manufacturer: "Mingplast",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_03",
      name: "INJ. 03 - MINGPLAST 45 S-7",
      model: "MINGPLAST 45 S-7",
      tonnage: "45 t",
      pavilhao: "P1",
      tag: "INJ. 03",
      manufacturer: "Mingplast",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_04",
      name: "INJ. 04 - CHEN HSONG 120",
      model: "CHEN HSONG 120",
      tonnage: "120 t",
      pavilhao: "P1",
      tag: "INJ. 04",
      manufacturer: "Chen Hsong",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_05",
      name: "INJ. 05 - TIANJIAN PL 86 S",
      model: "TIANJIAN PL 86 S",
      tonnage: "86 t",
      pavilhao: "P1",
      tag: "INJ. 05",
      manufacturer: "Tianjian",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_06",
      name: "INJ. 06 - TIANJIAN PL 86 S",
      model: "TIANJIAN PL 86 S",
      tonnage: "86 t",
      pavilhao: "P1",
      tag: "INJ. 06",
      manufacturer: "Tianjian",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_07",
      name: "INJ. 07 - TIANJIAN PL 86 S",
      model: "TIANJIAN PL 86 S",
      tonnage: "86 t",
      pavilhao: "P1",
      tag: "INJ. 07",
      manufacturer: "Tianjian",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_08",
      "name": "INJ. 08 - TEDERIC 80",
      model: "TEDERIC 80",
      tonnage: "80 t",
      pavilhao: "P1",
      tag: "INJ. 08",
      manufacturer: "Tederic",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_09",
      name: "INJ. 09 - HAITIAN MA G 120",
      model: "HAITIAN MA G 120",
      tonnage: "120 t",
      pavilhao: "P1",
      tag: "INJ. 09",
      manufacturer: "Haitian",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_10",
      name: "INJ. 10 - HAITIAN MA 1200",
      model: "HAITIAN MA 1200",
      tonnage: "120 t",
      pavilhao: "P1",
      tag: "INJ. 10",
      manufacturer: "Haitian",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_11",
      name: "INJ. 11 - HAITIAN W1200 S-",
      model: "HAITIAN W1200 S-",
      tonnage: "120 t",
      pavilhao: "P1",
      tag: "INJ. 11",
      manufacturer: "Haitian",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_12",
      name: "INJ. 12 - HAITIAN W1200 S-",
      model: "HAITIAN W1200 S-",
      tonnage: "120 t",
      pavilhao: "P1",
      tag: "INJ. 12",
      manufacturer: "Haitian",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p1_13",
      name: "INJ. 13 - LK POTENZA II",
      model: "LK POTENZA II",
      tonnage: "130 t",
      pavilhao: "P1",
      tag: "INJ. 13",
      manufacturer: "LK Machinery",
      location: "Pavilhão 1 (P1)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_A",
      name: "INJ. A - SINITROM SB 260",
      model: "SINITROM SB 260",
      tonnage: "260 t",
      pavilhao: "P2",
      tag: "INJ. A",
      manufacturer: "Sinitron",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_B",
      name: "INJ. B - TIANJIAN PL 2500",
      model: "TIANJIAN PL 2500",
      tonnage: "250 t",
      pavilhao: "P2",
      tag: "INJ. B",
      manufacturer: "Tianjian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_C",
      name: "INJ. C - HAITIAN MA 2500",
      model: "HAITIAN MA 2500",
      tonnage: "250 t",
      pavilhao: "P2",
      tag: "INJ. C",
      manufacturer: "Haitian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_D",
      name: "INJ. D - HAITIAN MA 2000 I",
      model: "HAITIAN MA 2000 I",
      tonnage: "200 t",
      pavilhao: "P2",
      tag: "INJ. D",
      manufacturer: "Haitian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_E",
      name: "INJ. E - HAITIAN MA 2000 2",
      model: "HAITIAN MA 2000 2",
      tonnage: "200 t",
      pavilhao: "P2",
      tag: "INJ. E",
      manufacturer: "Haitian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_F",
      name: "INJ. F - HAITIAN SA 2000",
      model: "HAITIAN SA 2000",
      tonnage: "200 t",
      pavilhao: "P2",
      tag: "INJ. F",
      manufacturer: "Haitian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_G",
      name: "INJ. G - HAITIAN X2000",
      model: "HAITIAN X2000",
      tonnage: "200 t",
      pavilhao: "P2",
      tag: "INJ. G",
      manufacturer: "Haitian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_H",
      name: "INJ. H - HAITIAN MA 1600 V",
      model: "HAITIAN MA 1600 V",
      tonnage: "160 t",
      pavilhao: "P2",
      tag: "INJ. H",
      manufacturer: "Haitian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_I",
      name: "INJ. I - HAITIAN W 1600",
      model: "HAITIAN W 1600",
      tonnage: "160 t",
      pavilhao: "P2",
      tag: "INJ. I",
      manufacturer: "Haitian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_J",
      name: "INJ. J - TIANJIAN PL 1600",
      model: "TIANJIAN PL 1600",
      tonnage: "160 t",
      pavilhao: "P2",
      tag: "INJ. J",
      manufacturer: "Tianjian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_L",
      name: "INJ. L - HAITIAN SA 1600 S",
      model: "HAITIAN SA 1600 S",
      tonnage: "160 t",
      pavilhao: "P2",
      tag: "INJ. L",
      manufacturer: "Haitian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_M",
      name: "INJ. M - HAITIAN MA G 1600",
      model: "HAITIAN MA G 1600",
      tonnage: "160 t",
      pavilhao: "P2",
      tag: "INJ. M",
      manufacturer: "Haitian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_N",
      name: "INJ. N - HAITIAN MA 1600 I",
      model: "HAITIAN MA 1600 I",
      tonnage: "160 t",
      pavilhao: "P2",
      tag: "INJ. N",
      manufacturer: "Haitian",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    },
    {
      id: "maq_p2_O",
      name: "INJ. O - BORCHE BI 320M",
      model: "BORCHE BI 320M",
      tonnage: "320 t",
      pavilhao: "P2",
      tag: "INJ. O",
      manufacturer: "Borche",
      location: "Pavilhão 2 (P2)",
      clientName: "Kadu Manutenções",
      horometer: "0h"
    }
  ],
  clients: [
    {
      id: "cli_1",
      name: "Indústria Metalúrgica Alvorada",
      document: "12.345.678/0001-90",
      phone: "(11) 98765-4321",
      address: "Rua das Indústrias, 450 - Galpão 3",
      contactPerson: "Eng. Marcos Rocha"
    },
    {
      id: "cli_2",
      name: "Usinagem Precisão Total",
      document: "23.456.789/0001-12",
      phone: "(11) 97654-3210",
      address: "Av. do Contorno, 800 - Distrito Industrial",
      contactPerson: "Sérgio Toledo"
    },
    {
      id: "cli_3",
      name: "Embalagens Brasil Sul",
      document: "34.567.890/0001-23",
      phone: "(11) 96543-2109",
      address: "Rodovia BR-116, Km 42 - Galpão B",
      contactPerson: "Dra. Patrícia Lima"
    }
  ],
  technicians: [
    { id: "tec_1", name: "Carlos Eduardo (Kadu)", phone: "(11) 99123-4567", role: "Técnico Responsável" },
    { id: "tec_2", name: "Rafael Duarte", phone: "(11) 98234-5678", role: "Técnico Mecatrônico" }
  ],
  assistants: [
    "Lucas Silva",
    "Rodrigo Mendes",
    "Felipe Barbosa"
  ],
  checklistTemplate: [
    { id: "c1", label: "Inspeção visual geral e verificação de vazamentos de óleo hidráulico", category: "Hidráulica" },
    { id: "c2", label: "Nível e condições do óleo no reservatório hidráulico", category: "Hidráulica" },
    { id: "c3", label: "Temperatura do óleo hidráulico e funcionamento do trocador de calor (resfriador)", category: "Hidráulica" },
    { id: "c4", label: "Limpeza e verificação do filtro de sucção do tanque hidráulico", category: "Hidráulica" },
    { id: "c5", label: "Limpeza e substituição do elemento do filtro de retorno hidráulico", category: "Hidráulica" },
    { id: "c6", label: "Estado e desobstrução do filtro de ar (respiro do reservatório)", category: "Hidráulica" },
    { id: "c7", label: "Verificação de ruídos e vibrações anormais na bomba hidráulica e motor elétrico", category: "Hidráulica" },
    { id: "c8", label: "Pressão do sistema hidráulico (bomba principal, proporcional e alívio)", category: "Hidráulica" },
    { id: "c9", label: "Condições e fixação das mangueiras e tubulações hidráulicas (sem atrito ou ressecamento)", category: "Hidráulica" },
    { id: "c10", label: "Vedação e ausência de vazamentos nos cilindros hidráulicos (fechamento, injeção, dosagem, extração)", category: "Hidráulica" },
    { id: "c11", label: "Nível e funcionamento do sistema automático de lubrificação centralizada", category: "Mecânica" },
    { id: "c12", label: "Condições das graxeiras, distribuidores e mangueiras de lubrificação", category: "Mecânica" },
    { id: "c13", label: "Lubrificação e estado das colunas guias e buchas da placa móvel", category: "Mecânica" },
    { id: "c14", label: "Lubrificação e inspeção de folgas nas articulações da joelheira (braços de fechamento)", category: "Mecânica" },
    { id: "c15", label: "Aperto e fixação mecânica de parafusos da base, placas e tirantes", category: "Mecânica" },
    { id: "c16", label: "Alinhamento, paralelismo e estado das placas (fixa e móvel)", category: "Mecânica" },
    { id: "c17", label: "Funcionamento do sistema de extração mecânica e hidráulica (curso e retorno)", category: "Mecânica" },
    { id: "c18", label: "Inspeção do conjunto de injeção (cilindro plastificador, bico e rosca)", category: "Mecânica" },
    { id: "c19", label: "Estado e fixação das resistências elétricas e termopares do canhão", category: "Elétrica" },
    { id: "c20", label: "Condições dos cabos elétricos, bornes, conexões e aperto no painel elétrico", category: "Elétrica" },
    { id: "c21", label: "Funcionamento dos contatores, relés térmicos, disjuntores e ventilação do painel", category: "Elétrica" },
    { id: "c22", label: "Teste e aferição das réguas potenciométricas (fechamento, injeção, extração)", category: "Elétrica" },
    { id: "c23", label: "Dispositivo de segurança mecânico (trava mecânica da porta frontal de fechamento)", category: "Segurança" },
    { id: "c24", label: "Dispositivo de segurança elétrico (micro-chaves, sensores e fins de curso de portas)", category: "Segurança" },
    { id: "c25", label: "Dispositivo de segurança hidráulico (válvula de segurança de bloqueio de fechamento)", category: "Segurança" },
    { id: "c26", label: "Funcionamento e atuação imediata dos botões de emergência (painel frontal e traseiro)", category: "Segurança" },
    { id: "c27", label: "Teste de ciclo operacional em vazio e conformidade de ciclos automáticos/manuais", category: "Segurança" }
  ],
  companySettings: {
    companyName: "KADU MANUTENÇÕES",
    tradeName: "Kadu Manutenções Industriais & Equipamentos",
    cnpj: "48.291.834/0001-90",
    phone: "(11) 98765-4321",
    email: "contato@kadumanutencoes.com.br",
    address: "Av. Industrial, 1420 - São Paulo, SP",
    logoUrl: "/src/assets/images/kadu_logo_1790525097159.jpg",
    primaryColor: "#0f172a",
    accentColor: "#0284c7",
    supabaseUrl: "",
    supabaseAnonKey: "",
    defaultWhatsappMessage: "Olá! Segue o relatório de manutenção da máquina [MÁQUINA], realizado em [DATA] pela Kadu Manutenções.",
    defaultEmailMessage: "Olá,\n\nSegue em anexo o relatório de manutenção referente à máquina [MÁQUINA].\n\nAtenciosamente,\nKadu Manutenções"
  }
};

// Database helper functions
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      return initialData;
    }
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading db.json, returning initialData:', err);
    return initialData;
  }
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

async function startServer() {
  const app = express();

  // Allow larger payloads for base64 photo sync
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static files for uploaded images
  app.use('/uploads', express.static(UPLOADS_DIR));

  // API Endpoints for multi-user sync
  app.get('/api/status', (req, res) => {
    res.json({
      status: 'online',
      timestamp: new Date().toISOString(),
      appName: 'Kadu Manutenções'
    });
  });

  // Get all data
  app.get('/api/data', (req, res) => {
    const data = readDb();
    res.json(data);
  });

  // Save report (Create or Update)
  app.post('/api/reports', (req, res) => {
    const report = req.body;
    const db = readDb();
    
    // Auto-generate code if needed (e.g. #0039)
    if (!report.code) {
      const nextNum = db.reports.length + 1;
      report.code = `#${String(nextNum).padStart(4, '0')}`;
    }
    if (!report.id) {
      report.id = `rel_${Date.now()}`;
    }
    report.updatedAt = new Date().toISOString();
    if (!report.createdAt) {
      report.createdAt = new Date().toISOString();
    }

    const existingIndex = db.reports.findIndex((r: any) => r.id === report.id);
    if (existingIndex >= 0) {
      db.reports[existingIndex] = report;
    } else {
      db.reports.unshift(report);
    }

    // Auto-register machine if not present
    if (report.machine && report.machine.name) {
      const machExists = db.machines.some((m: any) => m.name.toLowerCase() === report.machine.name.toLowerCase());
      if (!machExists) {
        db.machines.push({
          id: `maq_${Date.now()}`,
          name: report.machine.name,
          model: report.machine.model || '',
          serialNumber: report.machine.serialNumber || '',
          tag: report.machine.tag || '',
          clientName: report.client?.name || '',
          horometer: report.machine.horometer || '',
          location: report.machine.location || '',
          manufacturer: report.machine.manufacturer || ''
        });
      }
    }

    // Auto-register client if not present
    if (report.client && report.client.name) {
      const cliExists = db.clients.some((c: any) => c.name.toLowerCase() === report.client.name.toLowerCase());
      if (!cliExists) {
        db.clients.push({
          id: `cli_${Date.now()}`,
          name: report.client.name,
          document: report.client.document || '',
          phone: report.client.phone || '',
          address: report.client.address || '',
          contactPerson: report.client.contactPerson || ''
        });
      }
    }

    writeDb(db);
    res.json({ success: true, report });
  });

  // Delete report
  app.delete('/api/reports/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.reports = db.reports.filter((r: any) => r.id !== id);
    writeDb(db);
    res.json({ success: true, id });
  });

  // Save machines
  app.post('/api/machines', (req, res) => {
    const machine = req.body;
    const db = readDb();
    if (!machine.id) {
      machine.id = `maq_${Date.now()}`;
    }
    const idx = db.machines.findIndex((m: any) => m.id === machine.id);
    if (idx >= 0) {
      db.machines[idx] = machine;
    } else {
      db.machines.unshift(machine);
    }
    writeDb(db);
    res.json({ success: true, machine });
  });

  // Delete machine
  app.delete('/api/machines/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.machines = db.machines.filter((m: any) => m.id !== id);
    writeDb(db);
    res.json({ success: true, id });
  });

  // Save client
  app.post('/api/clients', (req, res) => {
    const client = req.body;
    const db = readDb();
    if (!client.id) {
      client.id = `cli_${Date.now()}`;
    }
    const idx = db.clients.findIndex((c: any) => c.id === client.id);
    if (idx >= 0) {
      db.clients[idx] = client;
    } else {
      db.clients.unshift(client);
    }
    writeDb(db);
    res.json({ success: true, client });
  });

  // Delete client
  app.delete('/api/clients/:id', (req, res) => {
    const { id } = req.params;
    const db = readDb();
    db.clients = db.clients.filter((c: any) => c.id !== id);
    writeDb(db);
    res.json({ success: true, id });
  });

  // Save settings (including team, template, Supabase config)
  app.post('/api/settings', (req, res) => {
    const newSettings = req.body;
    const db = readDb();
    if (newSettings.companySettings) {
      db.companySettings = { ...db.companySettings, ...newSettings.companySettings };
    }
    if (newSettings.technicians) {
      db.technicians = newSettings.technicians;
    }
    if (newSettings.assistants) {
      db.assistants = newSettings.assistants;
    }
    if (newSettings.checklistTemplate) {
      db.checklistTemplate = newSettings.checklistTemplate;
    }
    writeDb(db);
    res.json({ success: true, data: db });
  });

  // Upload photo endpoint (handles base64 data url and saves to disk for persistent url)
  app.post('/api/upload', (req, res) => {
    try {
      const { imageBase64, filename } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'No image data provided' });
      }

      const matches = imageBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      let buffer: Buffer;
      let ext = 'jpg';

      if (matches && matches.length === 3) {
        ext = matches[1].split('/')[1] || 'jpg';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(imageBase64, 'base64');
      }

      const cleanName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
      const filePath = path.join(UPLOADS_DIR, cleanName);
      fs.writeFileSync(filePath, buffer);

      const publicUrl = `/uploads/${cleanName}`;
      res.json({ success: true, url: publicUrl });
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Integrate Vite for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`> Kadu Manutenções server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
