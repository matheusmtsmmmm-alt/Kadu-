import { AppStateData } from '../types';
import { DEFAULT_LOGO_BASE64 } from './defaultLogo';

export const INITIAL_APP_DATA: AppStateData = {
  reports: [
    {
      id: "rel_1790526202056",
      code: "0003",
      date: "2026-09-27",
      status: "Finalizado",
      client: {
        id: "cli_oppeano",
        name: "Oppeano",
        document: "",
        phone: "",
        address: "Parque Fabril Oppeano",
        contactPerson: "Gerência de Produção"
      },
      machine: {
        id: "maq_p1_01",
        name: "INJ. 01 - STARMACH 55",
        model: "STARMACH 55",
        tonnage: "55 t",
        pavilhao: "P1",
        tag: "INJ. 01",
        manufacturer: "Starmach",
        location: "Produção 1 (P1)",
        clientName: "Oppeano",
        horometer: "0h"
      },
      technician: {
        id: "tec_1",
        name: "Carlos Eduardo (Kadu)",
        phone: "(11) 99123-4567",
        role: "Técnico Responsável"
      },
      assistants: [
        "Lucas Silva"
      ],
      times: {
        date: "2026-09-27",
        startTime: "10:00",
        endTime: "18:23"
      },
      maintenanceType: "Preventiva",
      equipmentStatus: "Inoperante",
      description: "Revisão geral do sistema de injeção e fechamento hidráulico.",
      partsReplaced: "Filtro de sucção e anéis de vedação.",
      checklist: [
        { id: "c1", label: "Inspeção visual geral e verificação de vazamentos", status: "conforme", notes: "" },
        { id: "c2", label: "Nível, viscosidade e estado do óleo lubrificante", status: "conforme", notes: "" },
        { id: "c3", label: "Limpeza, drenagem e desobstrução de filtros", status: "conforme", notes: "" },
        { id: "c4", label: "Tensão e alinhamento de correias / correntes / acoplamentos", status: "conforme", notes: "" },
        { id: "c5", label: "Aperto e fixação mecânica de parafusos e bases estruturais", status: "conforme", notes: "" },
        { id: "c6", label: "Condições de fiação, bornes e fechamento do painel elétrico", status: "conforme", notes: "" },
        { id: "c7", label: "Verificação de ruídos, atritos e vibrações anômalas", status: "conforme", notes: "" },
        { id: "c8", label: "Teste de sensores, cortinas de luz e botões de emergência", status: "conforme", notes: "" },
        { id: "c9", label: "Pressão hidráulica e pneumática de trabalho", status: "conforme", notes: "" },
        { id: "c10", label: "Teste final de ciclo operacional e conformidade funcional", status: "conforme", notes: "" }
      ],
      photosBefore: [],
      photosAfter: [],
      observations: "Máquina revisada e pronta para o próximo ciclo de trabalho.",
      futureRecommendations: "Monitorar temperatura do óleo nas próximas 100 horas.",
      signatures: {
        technician: {
          name: "Carlos Eduardo (Kadu)",
          signatureImage: "",
          date: "2026-09-27"
        },
        clientResponsible: {
          name: "Eng. Marcos Rocha",
          document: "CREA 506.912/SP",
          signatureImage: "",
          date: "2026-09-27"
        }
      },
      createdAt: "2026-09-27T13:25:00.000Z",
      updatedAt: "2026-09-27T18:23:00.000Z"
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
      horometer: "0h"
    },
    {
      id: "maq_p1_08",
      name: "INJ. 08 - TEDERIC 80",
      model: "TEDERIC 80",
      tonnage: "80 t",
      pavilhao: "P1",
      tag: "INJ. 08",
      manufacturer: "Tederic",
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 1 (P1)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
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
      location: "Produção 2 (P2)",
      clientName: "Oppeano",
      horometer: "0h"
    }
  ],
  clients: [
    {
      id: "cli_oppeano",
      name: "Oppeano",
      document: "",
      phone: "",
      address: "Parque Fabril Oppeano",
      contactPerson: "Gerência de Produção"
    }
  ],
  technicians: [
    {
      id: "tec_1",
      name: "Carlos Eduardo (Kadu)",
      phone: "(11) 99123-4567",
      role: "Técnico Responsável"
    },
    {
      id: "tec_2",
      name: "Rafael Duarte",
      phone: "(11) 98234-5678",
      role: "Técnico Mecatrônico"
    }
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
    logoUrl: DEFAULT_LOGO_BASE64,
    primaryColor: "#0f172a",
    accentColor: "#0284c7",
    supabaseUrl: "",
    supabaseAnonKey: "",
    defaultWhatsappMessage: "Olá! Segue o relatório de manutenção da máquina [MÁQUINA], realizado em [DATA] pela Kadu Manutenções.",
    defaultEmailMessage: "Olá,\n\nSegue em anexo o relatório de manutenção referente à máquina [MÁQUINA].\n\nAtenciosamente,\nKadu Manutenções",
    adminPin: "1111"
  }
};
