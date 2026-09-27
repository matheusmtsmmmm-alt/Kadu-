export interface DefaultChecklistItem {
  id: string;
  label: string;
  category: 'Hidráulica' | 'Mecânica' | 'Elétrica' | 'Segurança';
}

export const OFFICIAL_INJECTION_CHECKLIST: DefaultChecklistItem[] = [
  // 1 to 10: Hidráulica
  {
    id: "c1",
    label: "Inspeção visual geral e verificação de vazamentos de óleo hidráulico",
    category: "Hidráulica"
  },
  {
    id: "c2",
    label: "Nível e condições do óleo no reservatório hidráulico",
    category: "Hidráulica"
  },
  {
    id: "c3",
    label: "Temperatura do óleo hidráulico e funcionamento do trocador de calor (resfriador)",
    category: "Hidráulica"
  },
  {
    id: "c4",
    label: "Limpeza e verificação do filtro de sucção do tanque hidráulico",
    category: "Hidráulica"
  },
  {
    id: "c5",
    label: "Limpeza e substituição do elemento do filtro de retorno hidráulico",
    category: "Hidráulica"
  },
  {
    id: "c6",
    label: "Estado e desobstrução do filtro de ar (respiro do reservatório)",
    category: "Hidráulica"
  },
  {
    id: "c7",
    label: "Verificação de ruídos e vibrações anormais na bomba hidráulica e motor elétrico",
    category: "Hidráulica"
  },
  {
    id: "c8",
    label: "Pressão do sistema hidráulico (bomba principal, proporcional e alívio)",
    category: "Hidráulica"
  },
  {
    id: "c9",
    label: "Condições e fixação das mangueiras e tubulações hidráulicas (sem atrito ou ressecamento)",
    category: "Hidráulica"
  },
  {
    id: "c10",
    label: "Vedação e ausência de vazamentos nos cilindros hidráulicos (fechamento, injeção, dosagem, extração)",
    category: "Hidráulica"
  },

  // 11 to 18: Mecânica
  {
    id: "c11",
    label: "Nível e funcionamento do sistema automático de lubrificação centralizada",
    category: "Mecânica"
  },
  {
    id: "c12",
    label: "Condições das graxeiras, distribuidores e mangueiras de lubrificação",
    category: "Mecânica"
  },
  {
    id: "c13",
    label: "Lubrificação e estado das colunas guias e buchas da placa móvel",
    category: "Mecânica"
  },
  {
    id: "c14",
    label: "Lubrificação e inspeção de folgas nas articulações da joelheira (braços de fechamento)",
    category: "Mecânica"
  },
  {
    id: "c15",
    label: "Aperto e fixação mecânica de parafusos da base, placas e tirantes",
    category: "Mecânica"
  },
  {
    id: "c16",
    label: "Alinhamento, paralelismo e estado das placas (fixa e móvel)",
    category: "Mecânica"
  },
  {
    id: "c17",
    label: "Funcionamento do sistema de extração mecânica e hidráulica (curso e retorno)",
    category: "Mecânica"
  },
  {
    id: "c18",
    label: "Inspeção do conjunto de injeção (cilindro plastificador, bico e rosca)",
    category: "Mecânica"
  },

  // 19 to 22: Elétrica
  {
    id: "c19",
    label: "Estado e fixação das resistências elétricas e termopares do canhão",
    category: "Elétrica"
  },
  {
    id: "c20",
    label: "Condições dos cabos elétricos, bornes, conexões e aperto no painel elétrico",
    category: "Elétrica"
  },
  {
    id: "c21",
    label: "Funcionamento dos contatores, relés térmicos, disjuntores e ventilação do painel",
    category: "Elétrica"
  },
  {
    id: "c22",
    label: "Teste e aferição das réguas potenciométricas (fechamento, injeção, extração)",
    category: "Elétrica"
  },

  // 23 to 27: Segurança
  {
    id: "c23",
    label: "Dispositivo de segurança mecânico (trava mecânica da porta frontal de fechamento)",
    category: "Segurança"
  },
  {
    id: "c24",
    label: "Dispositivo de segurança elétrico (micro-chaves, sensores e fins de curso de portas)",
    category: "Segurança"
  },
  {
    id: "c25",
    label: "Dispositivo de segurança hidráulico (válvula de segurança de bloqueio de fechamento)",
    category: "Segurança"
  },
  {
    id: "c26",
    label: "Funcionamento e atuação imediata dos botões de emergência (painel frontal e traseiro)",
    category: "Segurança"
  },
  {
    id: "c27",
    label: "Teste de ciclo operacional em vazio e conformidade de ciclos automáticos/manuais",
    category: "Segurança"
  }
];
