# 🌌 Everything Constellation

> “Constelações contam histórias. Esta conecta as ciências da natureza.”

Um atlas interativo que parte do Big Bang e organiza conceitos de Física, Astronomia, Química e Biologia como uma constelação navegável. O objetivo é mostrar como áreas diferentes surgem de fundamentos comuns e continuam conectadas.

## Experiência

- Mapa espacial gerado por dados, sem Canvas ou bibliotecas externas.
- 33 conceitos distribuídos em quatro ramos científicos identificados por cor.
- Ligações retas em SVG, como os traços de constelações, e céu procedural em camadas.
- Pan e zoom com foco na posição do ponteiro.
- Suporte a mouse, teclado, toque e gesto de pinça.
- Painéis curtos com escala, descrição e fonte para consulta.
- Introdução cinematográfica ritmada, pulável e exibida apenas na primeira visita.
- Respeito à preferência de redução de movimento do navegador.

## Organização

- `data.js`: conteúdo, coordenadas, conexões, cores e fontes.
- `scripts.js`: renderização, câmera, gestos, introdução e painel de leitura.
- `styles.css`: atmosfera visual, nós, conexões e adaptação para telas menores.

Cada ponto do mapa é descrito por um objeto:

```js
{
    id: "primeiras_estrelas",
    titulo: "Primeiras estrelas",
    area: "astronomia",
    escala: "Centenas de milhões de anos",
    nivel: 2,
    x: 2320,
    y: 950,
    conexoes: ["galaxias", "supernovas"],
    conteudo: "Uma descrição curta e autossuficiente.",
    fonte: {
        nome: "NASA — História do Universo",
        url: "https://science.nasa.gov/universe/overview/"
    }
}
```

## Como expandir o mapa

1. Adicione o novo conceito em `data.js` com um `id` único.
2. Posicione-o próximo ao ramo correspondente.
3. Inclua seu `id` em `conexoes` no conceito anterior.
4. Use `nivel` de 1 a 3 para indicar a importância visual do nó.
5. Escreva uma explicação curta e inclua uma fonte confiável.

O motor verifica IDs repetidos, conexões ausentes, áreas sem cor e nós posicionados fora do Universo.

## Controles

- Arrastar: mover o mapa.
- Roda do mouse, gesto de pinça ou botões `+` e `−`: controlar o zoom.
- Setas: mover pelo teclado.
- `0`: retornar ao centro.
- `Esc`: fechar a curiosidade aberta.

## Roadmap

### 1. Melhorar a exploração

- [ ] Implementar zoom semântico: esconder detalhes ao afastar e revelá-los gradualmente ao aproximar.
- [ ] Transformar a legenda em um navegador que destaque e centralize cada ramo científico.
- [ ] Criar busca por conceito com viagem animada da câmera até o resultado.
- [ ] Marcar discretamente as estrelas já visitadas pelo usuário.

### 2. Criar jornadas de conhecimento

- [ ] Adicionar percursos guiados, como “do Big Bang às células” e “da gravidade aos exoplanetas”.
- [ ] Exibir uma pequena indicação de progresso durante cada jornada.
- [ ] Permitir seguir para o próximo conceito diretamente pelo painel de leitura.

### 3. Explicar melhor as relações

- [ ] Diferenciar visualmente conexões de progressão, influência e descoberta.
- [ ] Adicionar relações cruzadas entre áreas, como Física → Química e Química → Biologia.
- [ ] Criar uma visualização opcional por tempo, escala ou nível de organização da matéria.

### 4. Ampliar com consistência

- [ ] Desenvolver sub-ramos como astrofísica, ecologia, genética, química ambiental e física moderna.
- [ ] Manter as descrições curtas, autossuficientes e acompanhadas por fontes confiáveis.
- [ ] Automatizar verificações de IDs, conexões, coordenadas e campos obrigatórios antes da publicação.

O crescimento do projeto deve priorizar conexões significativas e formas novas de explorar o conhecimento, não apenas aumentar a quantidade de estrelas.

Feito com HTML, CSS, SVG e JavaScript puro por Jeryel A. Silva.
