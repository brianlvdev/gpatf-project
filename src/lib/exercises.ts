export const exerciseGroups: Record<string, string[]> = {
  'Braços': ['Rosca direta com barra', 'Rosca alternada com halteres', 'Rosca martelo', 'Rosca concentrada', 'Rosca Scott', 'Rosca bíceps na polia', 'Tríceps na polia com corda', 'Tríceps testa', 'Tríceps francês', 'Tríceps coice', 'Extensão de punho', 'Flexão de punho'],
  'Pernas e glúteos': ['Agachamento livre', 'Agachamento no Smith', 'Agachamento com cadeira', 'Agachamento goblet', 'Leg press horizontal', 'Leg press 45 graus', 'Cadeira extensora', 'Cadeira flexora', 'Mesa flexora', 'Cadeira abdutora', 'Cadeira adutora', 'Avanço com halteres', 'Afundo', 'Elevação pélvica', 'Ponte de glúteos', 'Stiff com halteres', 'Levantamento terra', 'Step-up no banco', 'Panturrilha em pé', 'Panturrilha sentado'],
  'Costas': ['Puxada frontal', 'Puxada com pegada neutra', 'Puxada com pegada supinada', 'Remada baixa', 'Remada curvada', 'Remada unilateral com halter', 'Remada articulada', 'Pullover na polia', 'Face pull', 'Crucifixo inverso'],
  'Peito': ['Supino reto com barra', 'Supino reto com halteres', 'Supino inclinado', 'Supino na máquina', 'Crucifixo com halteres', 'Peck deck', 'Crossover na polia', 'Flexão de braços na parede', 'Flexão de braços no banco'],
  'Ombros': ['Desenvolvimento com halteres', 'Desenvolvimento na máquina', 'Elevação lateral', 'Elevação frontal', 'Elevação lateral na polia', 'Rotação externa com elástico', 'Rotação interna com elástico', 'Encolhimento com halteres'],
  'Abdômen e core': ['Abdominal curto', 'Abdominal na máquina', 'Prancha', 'Prancha lateral', 'Dead bug', 'Bird dog', 'Pallof press', 'Elevação de joelhos'],
  'Cardio': ['Caminhada na esteira', 'Bicicleta ergométrica', 'Bicicleta horizontal', 'Elíptico', 'Remo ergométrico', 'Caminhada orientada'],
  'Mobilidade e equilíbrio': ['Mobilidade de tornozelo', 'Mobilidade de quadril', 'Mobilidade de ombros', 'Alongamento de panturrilha', 'Alongamento de posteriores', 'Alongamento de peitoral', 'Equilíbrio unipodal com apoio', 'Marcha estacionária', 'Sentar e levantar da cadeira'],
};
export const searchText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
