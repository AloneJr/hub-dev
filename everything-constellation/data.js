const FONTES_CIENTIFICAS = {
    nasaUniverso: {
        nome: "NASA — História do Universo",
        url: "https://science.nasa.gov/universe/overview/"
    },
    nasaElementos: {
        nome: "NASA Astrobiology — Poeira de estrelas",
        url: "https://astrobiology.nasa.gov/education/alp/are-we-really-made-of-star-stuff/"
    },
    cernUniverso: {
        nome: "CERN — O Universo primordial",
        url: "https://home.cern/science/physics/early-universe/"
    },
    cernModelo: {
        nome: "CERN — Modelo Padrão",
        url: "https://home.cern/science/physics/standard-model/"
    },
    openstaxQuimica: {
        nome: "OpenStax — Química em contexto",
        url: "https://openstax.org/books/chemistry/pages/1-1-chemistry-in-context"
    },
    openstaxLigacoes: {
        nome: "OpenStax — Ligações químicas",
        url: "https://openstax.org/books/anatomy-and-physiology-2e/pages/2-2-chemical-bonds"
    },
    ncbiRna: {
        nome: "NCBI — A hipótese do mundo de RNA",
        url: "https://www.ncbi.nlm.nih.gov/books/NBK26876/"
    },
    natureVida: {
        nome: "Nature Scitable — Domínios da vida",
        url: "https://www.nature.com/scitable/topicpage/the-two-empires-and-three-domains-of-14432998/"
    }
};

const NOS_CIENTIFICOS = [
    {
        id: "big_bang",
        titulo: "O Big Bang",
        area: "origem",
        escala: "13,8 bilhões de anos",
        nivel: 0,
        x: 1800,
        y: 1400,
        conexoes: ["particulas", "primeiros_atomos", "elementos_primordiais"],
        conteudo: "O Universo observável começou a se expandir a partir de um estado extremamente quente e denso. A teoria descreve sua evolução inicial, não uma explosão ocorrida dentro do espaço.",
        fonte: FONTES_CIENTIFICAS.nasaUniverso
    },
    {
        id: "particulas",
        titulo: "Partículas fundamentais",
        area: "origem",
        escala: "Escala subatômica",
        nivel: 1,
        x: 2050,
        y: 1590,
        conexoes: ["forcas_fundamentais"],
        conteudo: "No Universo muito jovem, matéria e radiação formavam um meio extremamente energético. Com o resfriamento, quarks puderam se combinar em prótons e nêutrons.",
        fonte: FONTES_CIENTIFICAS.cernUniverso
    },

    // FÍSICA — o braço inferior direito parte das regras mais fundamentais.
    {
        id: "forcas_fundamentais",
        titulo: "Forças fundamentais",
        area: "fisica",
        escala: "Fundamento da física",
        nivel: 1,
        x: 2310,
        y: 1780,
        conexoes: ["mecanica", "eletromagnetismo", "termodinamica", "fisica_quantica"],
        conteudo: "Gravidade, eletromagnetismo e forças forte e fraca governam as interações conhecidas da matéria. Cada uma atua de modo diferente conforme a distância e a energia.",
        fonte: FONTES_CIENTIFICAS.cernModelo
    },
    {
        id: "mecanica",
        titulo: "Mecânica",
        area: "fisica",
        escala: "Movimento cotidiano",
        nivel: 2,
        x: 2580,
        y: 1580,
        conexoes: ["gravitacao"],
        conteudo: "A mecânica descreve repouso, movimento e as forças capazes de alterá-los. Ela explica desde a queda de um objeto até a trajetória de um veículo.",
        fonte: FONTES_CIENTIFICAS.cernModelo
    },
    {
        id: "gravitacao",
        titulo: "Gravitação",
        area: "fisica",
        escala: "Da Terra às órbitas",
        nivel: 3,
        x: 2890,
        y: 1470,
        conexoes: [],
        conteudo: "A gravidade atrai corpos com massa e organiza quedas, órbitas e sistemas astronômicos. Na relatividade geral, ela aparece como curvatura do espaço-tempo.",
        fonte: FONTES_CIENTIFICAS.cernModelo
    },
    {
        id: "eletromagnetismo",
        titulo: "Eletromagnetismo",
        area: "fisica",
        escala: "Cargas e campos",
        nivel: 2,
        x: 2680,
        y: 1830,
        conexoes: ["ondas_eletromagneticas"],
        conteudo: "Cargas elétricas produzem campos que podem atrair, repelir e transportar energia. Eletricidade, magnetismo e luz são manifestações da mesma interação.",
        fonte: FONTES_CIENTIFICAS.cernModelo
    },
    {
        id: "ondas_eletromagneticas",
        titulo: "Luz e outras ondas",
        area: "fisica",
        escala: "Do rádio aos raios gama",
        nivel: 3,
        x: 3010,
        y: 1740,
        conexoes: [],
        conteudo: "Ondas eletromagnéticas transportam energia pelo espaço. Rádio, micro-ondas, luz visível, raios X e raios gama diferem principalmente em frequência e comprimento de onda.",
        fonte: FONTES_CIENTIFICAS.cernModelo
    },
    {
        id: "termodinamica",
        titulo: "Termodinâmica",
        area: "fisica",
        escala: "Calor e energia",
        nivel: 2,
        x: 2540,
        y: 2100,
        conexoes: ["entropia"],
        conteudo: "A termodinâmica estuda como calor, trabalho e energia se transformam. Suas leis também indicam por que certos processos naturais têm uma direção preferencial.",
        fonte: FONTES_CIENTIFICAS.cernModelo
    },
    {
        id: "entropia",
        titulo: "Entropia",
        area: "fisica",
        escala: "Direção dos processos",
        nivel: 3,
        x: 2800,
        y: 2370,
        conexoes: [],
        conteudo: "Entropia ajuda a medir quantas configurações microscópicas correspondem a um estado. Em sistemas isolados, sua tendência de aumento define uma seta para o tempo.",
        fonte: FONTES_CIENTIFICAS.cernModelo
    },
    {
        id: "fisica_quantica",
        titulo: "Física quântica",
        area: "fisica",
        escala: "Átomos e partículas",
        nivel: 2,
        x: 2940,
        y: 2070,
        conexoes: [],
        conteudo: "A física quântica descreve matéria e energia em escalas muito pequenas, onde probabilidades, quantização e dualidade substituem várias intuições do mundo cotidiano.",
        fonte: FONTES_CIENTIFICAS.cernModelo
    },

    // ASTRONOMIA — o braço superior direito acompanha a organização do cosmos.
    {
        id: "primeiros_atomos",
        titulo: "Primeiros átomos",
        area: "astronomia",
        escala: "Cerca de 380 mil anos",
        nivel: 1,
        x: 2070,
        y: 1170,
        conexoes: ["primeiras_estrelas"],
        conteudo: "Quando o Universo esfriou, núcleos capturaram elétrons e formaram principalmente átomos de hidrogênio e hélio. A luz passou então a viajar com muito menos obstáculos.",
        fonte: FONTES_CIENTIFICAS.nasaUniverso
    },
    {
        id: "primeiras_estrelas",
        titulo: "Primeiras estrelas",
        area: "astronomia",
        escala: "Centenas de milhões de anos",
        nivel: 2,
        x: 2320,
        y: 950,
        conexoes: ["galaxias", "supernovas", "sistemas_planetarios"],
        conteudo: "A gravidade reuniu grandes nuvens de gás até que seus núcleos iniciaram a fusão nuclear. Essas primeiras estrelas iluminaram um cosmos que ainda não tinha planetas.",
        fonte: FONTES_CIENTIFICAS.nasaUniverso
    },
    {
        id: "galaxias",
        titulo: "Galáxias",
        area: "astronomia",
        escala: "Estruturas cósmicas",
        nivel: 2,
        x: 2600,
        y: 690,
        conexoes: ["teia_cosmica"],
        conteudo: "Galáxias são grandes sistemas de estrelas, gás, poeira e matéria escura ligados pela gravidade. Elas também se reúnem em grupos e aglomerados.",
        fonte: FONTES_CIENTIFICAS.nasaUniverso
    },
    {
        id: "teia_cosmica",
        titulo: "Teia cósmica",
        area: "astronomia",
        escala: "A maior escala",
        nivel: 3,
        x: 2940,
        y: 500,
        conexoes: [],
        conteudo: "Galáxias e matéria escura formam filamentos separados por grandes vazios. Essa rede revela como pequenas diferenças iniciais cresceram sob a ação da gravidade.",
        fonte: FONTES_CIENTIFICAS.nasaUniverso
    },
    {
        id: "supernovas",
        titulo: "Supernovas",
        area: "astronomia",
        escala: "Evolução estelar",
        nivel: 2,
        x: 2660,
        y: 1040,
        conexoes: ["buracos_negros"],
        conteudo: "Algumas estrelas terminam em explosões extremamente energéticas. Elas espalham pelo espaço elementos produzidos durante a vida e a morte da estrela.",
        fonte: FONTES_CIENTIFICAS.nasaElementos
    },
    {
        id: "buracos_negros",
        titulo: "Buracos negros",
        area: "astronomia",
        escala: "Gravidade extrema",
        nivel: 3,
        x: 3000,
        y: 900,
        conexoes: [],
        conteudo: "Buracos negros são regiões onde a gravidade cria um limite do qual nem a luz escapa. Muitos nascem do colapso de estrelas muito massivas.",
        fonte: FONTES_CIENTIFICAS.nasaUniverso
    },
    {
        id: "sistemas_planetarios",
        titulo: "Sistemas planetários",
        area: "astronomia",
        escala: "Estrelas e órbitas",
        nivel: 2,
        x: 2830,
        y: 1290,
        conexoes: ["exoplanetas"],
        conteudo: "Discos de gás e poeira ao redor de estrelas jovens podem formar planetas, luas e pequenos corpos. A gravidade mantém esses objetos em órbita.",
        fonte: FONTES_CIENTIFICAS.nasaElementos
    },
    {
        id: "exoplanetas",
        titulo: "Exoplanetas",
        area: "astronomia",
        escala: "Outros mundos",
        nivel: 3,
        x: 3180,
        y: 1430,
        conexoes: [],
        conteudo: "Exoplanetas orbitam estrelas além do Sistema Solar. Sua massa, órbita e atmosfera ajudam a comparar a diversidade de mundos da nossa galáxia.",
        fonte: FONTES_CIENTIFICAS.nasaUniverso
    },

    // QUÍMICA — o braço superior esquerdo acompanha a organização da matéria.
    {
        id: "elementos_primordiais",
        titulo: "Elementos químicos",
        area: "quimica",
        escala: "Dos átomos à matéria",
        nivel: 1,
        x: 1530,
        y: 1190,
        conexoes: ["ligacoes_quimicas", "moleculas_da_vida"],
        conteudo: "O Big Bang produziu sobretudo hidrogênio e hélio; estrelas e eventos estelares formaram muitos elementos mais pesados. Cada elemento é definido pelo número de prótons.",
        fonte: FONTES_CIENTIFICAS.nasaElementos
    },
    {
        id: "ligacoes_quimicas",
        titulo: "Ligações químicas",
        area: "quimica",
        escala: "Átomos e moléculas",
        nivel: 2,
        x: 1260,
        y: 960,
        conexoes: ["reacoes_quimicas", "quimica_organica", "materiais"],
        conteudo: "Interações entre elétrons mantêm átomos unidos em moléculas e compostos. O modo como eles compartilham ou transferem elétrons determina muitas propriedades da matéria.",
        fonte: FONTES_CIENTIFICAS.openstaxLigacoes
    },
    {
        id: "reacoes_quimicas",
        titulo: "Reações químicas",
        area: "quimica",
        escala: "Transformação da matéria",
        nivel: 2,
        x: 980,
        y: 720,
        conexoes: ["equilibrio_quimico"],
        conteudo: "Numa reação, ligações são rompidas e formadas, reorganizando átomos em novas substâncias. A quantidade de cada elemento permanece conservada durante o processo.",
        fonte: FONTES_CIENTIFICAS.openstaxQuimica
    },
    {
        id: "equilibrio_quimico",
        titulo: "Equilíbrio químico",
        area: "quimica",
        escala: "Reações reversíveis",
        nivel: 3,
        x: 650,
        y: 510,
        conexoes: [],
        conteudo: "No equilíbrio, reações direta e inversa continuam ocorrendo na mesma taxa. As concentrações permanecem estáveis, embora as moléculas sigam reagindo.",
        fonte: FONTES_CIENTIFICAS.openstaxQuimica
    },
    {
        id: "quimica_organica",
        titulo: "Química orgânica",
        area: "quimica",
        escala: "Compostos de carbono",
        nivel: 3,
        x: 900,
        y: 1040,
        conexoes: [],
        conteudo: "A química orgânica estuda principalmente compostos de carbono. A capacidade desse elemento de formar cadeias e anéis sustenta uma enorme variedade de moléculas.",
        fonte: FONTES_CIENTIFICAS.openstaxQuimica
    },
    {
        id: "materiais",
        titulo: "Ciência dos materiais",
        area: "quimica",
        escala: "Estrutura e propriedades",
        nivel: 3,
        x: 720,
        y: 830,
        conexoes: [],
        conteudo: "A organização de átomos e moléculas define propriedades como resistência, condutividade e flexibilidade. Controlar essa estrutura permite criar materiais com novas funções.",
        fonte: FONTES_CIENTIFICAS.openstaxQuimica
    },

    // BIOLOGIA — o braço inferior esquerdo parte da química da vida.
    {
        id: "moleculas_da_vida",
        titulo: "Moléculas da vida",
        area: "biologia",
        escala: "Química prebiótica",
        nivel: 1,
        x: 1490,
        y: 1640,
        conexoes: ["mundo_rna"],
        conteudo: "Moléculas baseadas em carbono podem formar cadeias variadas e interagir com água. Essa diversidade química fornece os componentes usados pelos sistemas vivos.",
        fonte: FONTES_CIENTIFICAS.openstaxQuimica
    },
    {
        id: "mundo_rna",
        titulo: "Mundo de RNA",
        area: "biologia",
        escala: "Hipótese sobre a origem da vida",
        nivel: 2,
        x: 1250,
        y: 1830,
        conexoes: ["protocelulas"],
        conteudo: "A hipótese do mundo de RNA propõe uma fase em que moléculas semelhantes ao RNA armazenavam informação e também favoreciam reações, antes dos sistemas celulares atuais.",
        fonte: FONTES_CIENTIFICAS.ncbiRna
    },
    {
        id: "protocelulas",
        titulo: "Protocélulas",
        area: "biologia",
        escala: "Compartimentos primitivos",
        nivel: 2,
        x: 1020,
        y: 2000,
        conexoes: ["luca"],
        conteudo: "Protocélulas são modelos de compartimentos simples capazes de concentrar moléculas e separar reações do ambiente. Elas ajudam a investigar etapas anteriores às primeiras células.",
        fonte: FONTES_CIENTIFICAS.ncbiRna
    },
    {
        id: "luca",
        titulo: "LUCA",
        area: "biologia",
        escala: "Ancestralidade celular",
        nivel: 2,
        x: 790,
        y: 2160,
        conexoes: ["evolucao", "bacterias_arqueias"],
        conteudo: "LUCA representa a população ancestral mais recente da qual descende toda a vida celular atual. Não foi necessariamente o primeiro ser vivo nem um único organismo.",
        fonte: FONTES_CIENTIFICAS.natureVida
    },
    {
        id: "bacterias_arqueias",
        titulo: "Bactérias e arqueias",
        area: "biologia",
        escala: "Diversidade microscópica",
        nivel: 3,
        x: 470,
        y: 1990,
        conexoes: [],
        conteudo: "Bactérias e arqueias são domínios celulares distintos, apesar da aparência simples. Seus metabolismos sustentam ciclos químicos essenciais em quase todos os ambientes.",
        fonte: FONTES_CIENTIFICAS.natureVida
    },
    {
        id: "evolucao",
        titulo: "Evolução biológica",
        area: "biologia",
        escala: "Mudança entre gerações",
        nivel: 2,
        x: 690,
        y: 2360,
        conexoes: ["eucariontes", "ecossistemas"],
        conteudo: "Populações mudam ao longo das gerações por mutação, seleção, deriva e fluxo gênico. A ramificação dessas linhagens produz a diversidade da vida.",
        fonte: FONTES_CIENTIFICAS.natureVida
    },
    {
        id: "eucariontes",
        titulo: "Células eucarióticas",
        area: "biologia",
        escala: "Células complexas",
        nivel: 3,
        x: 410,
        y: 2520,
        conexoes: ["multicelularidade"],
        conteudo: "Eucariontes possuem núcleo e compartimentos internos. As mitocôndrias descendem de bactérias incorporadas por uma célula ancestral em uma associação duradoura.",
        fonte: FONTES_CIENTIFICAS.natureVida
    },
    {
        id: "multicelularidade",
        titulo: "Multicelularidade",
        area: "biologia",
        escala: "Cooperação entre células",
        nivel: 3,
        x: 170,
        y: 2630,
        conexoes: [],
        conteudo: "Organismos multicelulares coordenam células especializadas que dividem funções. Essa estratégia surgiu mais de uma vez na história evolutiva.",
        fonte: FONTES_CIENTIFICAS.natureVida
    },
    {
        id: "ecossistemas",
        titulo: "Ecossistemas",
        area: "biologia",
        escala: "Vida e ambiente",
        nivel: 3,
        x: 350,
        y: 2290,
        conexoes: [],
        conteudo: "Ecossistemas reúnem organismos e componentes físicos ligados por fluxos de energia e ciclos de matéria. Uma alteração pode se propagar por toda a rede.",
        fonte: FONTES_CIENTIFICAS.natureVida
    }
];

window.MAPA_CIENCIAS = Object.freeze({
    tamanhoUniverso: Object.freeze({ largura: 3600, altura: 2800 }),
    centro: Object.freeze({ x: 1800, y: 1400 }),
    limitesZoom: Object.freeze({ minimo: 0.28, maximo: 1.9 }),
    cores: Object.freeze({
        origem: "#ffe7ad",
        fisica: "#55d6ff",
        astronomia: "#b78cff",
        quimica: "#ffc65c",
        biologia: "#62efa5"
    }),
    rotulosRamos: Object.freeze([
        { nome: "Astronomia", area: "astronomia", x: 2820, y: 350 },
        { nome: "Física", area: "fisica", x: 3040, y: 2470 },
        { nome: "Química", area: "quimica", x: 570, y: 340 },
        { nome: "Biologia", area: "biologia", x: 430, y: 2730 }
    ]),
    nos: Object.freeze(NOS_CIENTIFICOS)
});
