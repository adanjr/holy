import { z } from "zod";

export const animationFamilies = [
  { value: "chart", label: "Charts" },
  { value: "map", label: "Maps" },
  { value: "structure", label: "Diagrams & Structure" },
  { value: "media", label: "Media" },
  { value: "editorial", label: "Editorial" },
  { value: "branding", label: "Branding" },
  { value: "ranking", label: "Rankings" },
] as const;

export type AnimationFamily = (typeof animationFamilies)[number]["value"];

export type VisualizationDefinition = {
  id: string;
  legacyType: string;
  family: AnimationFamily;
  label: string;
  description: string;
  requiresAssets?: number;
  acceptsAssets?: boolean;
  promptPlaceholder?: string;
  promptExample?: string;
};

export const visualizationCatalog: VisualizationDefinition[] = [
  {
    id: "chart.bar",
    legacyType: "bar-chart",
    family: "chart",
    label: "Bars",
    description: "Compare values across categories.",
    promptExample:
      "Compare quarterly revenue: Q1 $42M, Q2 $58M, Q3 $71M, and Q4 $89M. Reveal each bar from left to right and emphasize Q4 as the highest value.",
  },
  {
    id: "chart.line",
    legacyType: "line-chart",
    family: "chart",
    label: "Lines",
    description: "Show change over time.",
    promptExample:
      "Show monthly active users growing from 12,000 in January to 18,000 in February, 27,000 in March, 35,000 in April, and 48,000 in May. Animate the line chronologically and highlight the final value.",
  },
  {
    id: "chart.donut",
    legacyType: "donut-chart",
    family: "chart",
    label: "Donut",
    description: "Show proportions of a whole.",
    promptExample:
      "Display the 2025 marketing budget split: Social Media 40%, Video 30%, Search 20%, and Events 10%. Reveal each segment clockwise and show its label and percentage.",
  },
  {
    id: "map.route",
    legacyType: "map-route",
    family: "map",
    label: "Route Map",
    description: "Animate movement between locations.",
    promptExample:
      "Trace a flight route from Mexico City to New York, then to London and finally Paris on a watercolor map. Draw the route progressively, pause at each city, and label every stop.",
  },
  {
    id: "map.points",
    legacyType: "map-points",
    family: "map",
    label: "Map Points",
    description: "Highlight cities and locations.",
    promptExample:
      "Highlight our offices in Mexico City, Monterrey, Guadalajara, Bogotá, and Madrid. Introduce each location with a pulsing marker and keep all city labels visible.",
  },
  {
    id: "map.historical-timeline",
    legacyType: "map-historical-timeline",
    family: "map",
    label: "Historical Timeline Map",
    description: "Show geographic changes across a sequence of historical stages.",
    promptPlaceholder: "Example: European Union expansion from 1957 to 2013",
    promptExample: "Show the expansion of the European Union in four stages: 1957 founding members, 1973 first enlargement, 2004 eastern enlargement, and 2013 Croatia. Highlight the countries active at each stage and explain every milestone.",
  },  {
    id: "map.migration-flow",
    legacyType: "map-migration-flow",
    family: "map",
    label: "Animated Migration Flow",
    description: "Animate proportional flows between origins and destinations.",
    promptPlaceholder: "Example: Migration from Venezuela to Colombia, Peru, Chile, and the US",
    promptExample: "Show migration from Caracas, Venezuela to Bogotá, Lima, Santiago, and Miami. Use curved animated flows whose thickness represents 1.8M, 1.3M, 500K, and 400K people respectively.",
  },  {
    id: "map.choropleth",
    legacyType: "map-choropleth",
    family: "map",
    label: "Choropleth Map",
    description: "Color countries by numeric intensity and display a value scale.",
    promptPlaceholder: "Example: Color European countries by renewable energy percentage",
    promptExample: "Create a choropleth map comparing renewable energy use: Spain 42%, France 27%, Germany 46%, Italy 36%, and Portugal 61%. Use a blue intensity scale and show the percentage labels.",
  },
  {
    id: "map.country-comparison",
    legacyType: "map-country-comparison",
    family: "map",
    label: "Country Comparison",
    description: "Compare two to five highlighted countries with optional values.",
    promptPlaceholder: "Example: Compare Mexico, Brazil, and Argentina by population",
    promptExample: "Compare Mexico, Brazil, and Argentina. Use a different color for each country and show population: Mexico 130M, Brazil 216M, Argentina 46M.",
  },
  {
    id: "map.location-zoom",
    legacyType: "map-location-zoom",
    family: "map",
    label: "Location Zoom",
    description: "Zoom from a geographic overview into progressively more specific locations.",
    promptPlaceholder: "Example: World to Mexico, Mexico City, and the Historic Center",
    promptExample: "Start with the world, zoom into Mexico, then Mexico City, and finish at the Historic Center. Label every level and use a standard map.",
  },
  {
    id: "map.country-highlight",
    legacyType: "map-country-highlight",
    family: "map",
    label: "Country Highlight",
    description: "Shade one country, label it, and optionally show more information.",
    promptPlaceholder: "Example: Highlight Mexico in emerald green and add: Population 130 million",
    promptExample: "Highlight Mexico with an emerald green layer, show the country name, and add an information box with ‘Population: 130 million’ and ‘Capital: Mexico City’.",
  },
  {
    id: "structure.nodes",
    legacyType: "connected-nodes",
    family: "structure",
    label: "Connected Nodes",
    description: "Show relationships between entities.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptExample:
      "Place the selected company image at the center and connect it to three nodes: Customers, Partners, and Suppliers. Reveal the connections one by one with a soft pulse.",
  },
  {
    id: "content.web",
    legacyType: "web",
    family: "media",
    label: "Web Page Scroll",
    description:
      "Sweep from the top of a web page toward the bottom, with an optional URL label.",
    promptPlaceholder:
      "Example: Scroll https://example.com from top to bottom and show the URL",
    promptExample:
      "Open https://example.com, show the URL at the top, and scroll smoothly from the hero section to the bottom of the page. Pause briefly on the main call-to-action.",
  },
  {
    id: "content.article",
    legacyType: "article-scroll",
    family: "media",
    label: "Article Scroll",
    description: "Clean and scroll through a focused article or news story.",
    promptPlaceholder:
      "Example: Open https://example.com/article and scroll from the headline to the end",
    promptExample:
      "Open https://example.com/article, preserve the headline, author, publication date, and lead image. Remove navigation, ads, cookie banners, and related stories, then scroll smoothly from the headline to the end of the article.",
  },
  {
    id: "content.fact-card",
    legacyType: "disclaimer",
    family: "editorial",
    label: "Editorial Fact",
    description: "Turn descriptive narration into an editorial title card.",
    promptExample:
      "More than 60% of online purchases now begin on a mobile device. Reveal the percentage first in large type, then bring in the supporting sentence with subtle motion.",
  },
  {
    id: "content.quote-card",
    legacyType: "quote-card",
    family: "editorial",
    label: "Quote Card",
    description:
      "Present a quotation with its author and title in editorial boxes.",
    acceptsAssets: true,
    promptPlaceholder: "Quote, author, title, position and optional colors",
    promptExample:
      "Use the selected image as the background. Show the quote ‘Imagination is more important than knowledge.’ by Albert Einstein, theoretical physicist. Place it bottom-left using black boxes with white text.",
  },
  {
    id: "content.disclaimer",
    legacyType: "disclaimer",
    family: "editorial",
    label: "Disclaimer",
    description: "Display an editorial notice.",
    acceptsAssets: true,
    promptExample:
      "Important: The results shown are estimates based on historical data and do not guarantee future performance. Display the notice clearly with a calm fade-in and subtle emphasis on ‘do not guarantee’.",
  },
  {
    id: "content.media-overlay",
    legacyType: "media-overlay",
    family: "media",
    label: "Media Overlay",
    description: "Combine a headline with project media.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptExample:
      "Use the selected image as the main visual. Overlay the headline ‘A New Era of Clean Energy’ and the subtitle ‘Investment reached a record high in 2025’, entering from the lower left.",
  },
  {
    id: "content.framed-footage",
    legacyType: "framed-footage",
    family: "media",
    label: "Framed Footage",
    description: "Play archival footage inside a stylized physical or vintage screen.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptPlaceholder: "Frame preset, optional title, caption and year",
    promptExample: "Play the selected archival video inside an analog TV. Add the title ‘The early days of computing’, the caption ‘Rare footage from the university laboratory’, and the year ‘1976’. Use a restrained vintage look. Available frame presets: analog TV, film projector, CRT monitor, camcorder viewfinder, and photo frame.",
  },
  {
    id: "content.speaker-split",
    legacyType: "speaker-split",
    family: "media",
    label: "Speaker + Text Split",
    description: "Place a speaker video beside an animated corporate message.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptPlaceholder: "Message, speaker side and optional background color",
    promptExample:
      "Show the selected image or speaker video full screen first. Then split the screen and keep the media on the right while the text appears on the left. Use the eyebrow ‘SYSTEM RELIABILITY’ and the heading ‘How to build a resilient response’. Use a dark blue background with white text. Show the bullet ‘Keep customer impact visible’ from the start. Then reveal these numbered points one by one in order: 1. Identify the immediate bottleneck; 2. Evaluate the operational trade-offs; 3. Propose a long-term solution. Under point 2, add the level-1 bullet ‘Balance cost, risk, and recovery time’.",
  },
  {
    id: "content.multi-panel",
    legacyType: "multi-panel",
    family: "media",
    label: "Multi Panel",
    description: "Compose three media items in one frame.",
    requiresAssets: 3,
    acceptsAssets: true,
    promptExample:
      "Present the three selected images as Innovation, Growth, and Global Reach. Introduce the panels one at a time from left to right, then hold all three together with their labels.",
  },
  {
    id: "content.video-split",
    legacyType: "video-split",
    family: "media",
    label: "Two Videos Side by Side",
    description: "Play exactly two videos simultaneously in a balanced split screen.",
    requiresAssets: 2,
    acceptsAssets: true,
    promptPlaceholder: "Optional title and labels for the left and right videos",
    promptExample:
      "Play the two selected videos side by side at the same time. Add the title Before and After. Label the left video Before and the right video After. Keep both videos visible for the entire animation.",
  },
  {
    id: "content.feature-cards",
    legacyType: "feature-cards",
    family: "structure",
    label: "Three Feature Cards",
    description: "Present three ideas with icons in animated corporate cards.",
    promptPlaceholder: "Slide title and three icon-supported ideas",
    promptExample:
      "Title: ‘Beyond technical expertise.’ Show three boxes: a magnifying glass with ‘Technical expertise is the starting point.’, a pen and paper with ‘Translate technical decisions into business impact.’, and a wrench with ‘Build pipelines or manage clusters.’",
  },
  {
    id: "content.bullet-list",
    legacyType: "bullet-list",
    family: "structure",
    label: "Bullet List",
    description: "Introduce a topic with a title and sequential key points.",
    promptPlaceholder: "Slide title followed by two to five bullet points",
    promptExample: "A slide titled ‘In this video, you will see:’ lists two bullet points. The first is ‘How to structure a strong response to a system reliability interview question.’ The second is ‘A mock interview that demonstrates how to move from a simple answer to a strategic, trade-off-focused analysis.’",
  },
  {
    id: "content.side-by-side-comparison",
    legacyType: "side-by-side-comparison",
    family: "structure",
    label: "Side-by-Side Comparison",
    description: "Compare two approaches and their trade-offs.",
    promptPlaceholder: "Two headings, approaches, and their trade-offs",
    promptExample: "A graphic displays a side-by-side comparison. On the left, under the heading ‘Short-term fix,’ the text reads: ‘Increases the database connection pool size.’ and ‘Trade-off: Quick relief, but higher operational cost and risk of masking deeper issues.’ On the right, under the heading ‘Long-term fix,’ the text reads: ‘Implements a connection pooling library within the service.’ and ‘Trade-off: Requires development time, but improves resilience and reduces long-term cost.’",
  },
  {
    id: "content.puzzle-steps",
    legacyType: "puzzle-steps",
    family: "structure",
    label: "Puzzle Steps",
    description: "Connect three numbered ideas as animated puzzle pieces.",
    promptPlaceholder: "Slide title and three numbered puzzle-piece ideas",
    promptExample:
      "Title the slide ‘Internal DevEx’. Connect three puzzle pieces numbered 01, 02, and 03 with the texts ‘Reduce friction’, ‘Enable self-service’, and ‘Accelerate delivery’.",
  },
  {
    id: "content.hub-spokes",
    legacyType: "hub-spokes",
    family: "structure",
    label: "Hub & Spokes",
    description: "Connect four oval concepts to one central business idea.",
    promptPlaceholder: "Central concept and four connected labels",
    promptExample:
      "Create a diagram with a central circle labeled ‘Language of business’. Connect four ovals labeled ‘ROI’, ‘DORA’, ‘MTTR’, and ‘Developer velocity’.",
  },
  {
    id: "content.editorial-cover",
    legacyType: "editorial-cover",
    family: "editorial",
    label: "Editorial Cover",
    description:
      "Create a magazine-style photo cover with a large editorial headline.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptPlaceholder:
      "Label, headline, optional subtitle, position and colors",
    promptExample:
      "Use the selected photo of the entrepreneurs. Add the label ‘DAILY COVER’ above the headline ‘The founders building the next generation of Mexican companies’. Place the text at the bottom in large white letters with a gold accent.",
  },
  {
    id: "content.news-story",
    legacyType: "news-story-card",
    family: "editorial",
    label: "News Story Card",
    description: "Present a trending or historical news story over a photo.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptPlaceholder:
      "Editorial label, headline, short summary, outlet, date and colors",
    promptExample:
      "Use the first selected image as the story photo and the second as the portal logo. Label it ‘FROM THE ARCHIVES’. Headline: ‘The day the world entered the internet age’. Add a two-line summary, outlet ‘The Daily Chronicle’, and publication date ‘August 6, 1991’. Use white text with a red accent.",
  },
  {
    id: "content.course-intro",
    legacyType: "course-intro",
    family: "branding",
    label: "Course / Chapter Intro",
    description:
      "Open a course or chapter with a serious, PowerPoint-style title slide.",
    acceptsAssets: true,
    promptPlaceholder:
      "Course or chapter title, optional subtitle, logos and logo position",
    promptExample:
      "A blue title slide reads: ‘The Senior DevOps Job Market’. Use the Coursera and Microsoft logos in the top corners. Add the eyebrow ‘COURSE INTRO’ and a restrained corporate background.",
  },
  {
    id: "branding.logo-grid",
    legacyType: "logo-grid",
    family: "branding",
    label: "Logo Grid",
    description: "Reveal a collection of brands.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptExample:
      "Create a clean partner showcase using the selected logos. Reveal them row by row with a soft scale-up, keep equal spacing, and finish with the title ‘Trusted by Industry Leaders’.",
  },
  {
    id: "branding.logo-grid-names",
    legacyType: "logo-grid-names",
    family: "branding",
    label: "Logo Grid with Names",
    description: "Show logos with their labels.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptExample:
      "Show the selected brand logos in a balanced grid with each company name beneath its logo. Reveal each pair sequentially and end with all brands visible.",
  },
  {
    id: "branding.logo-reveal",
    legacyType: "logo-reveal",
    family: "branding",
    label: "Logo Reveal",
    description: "Create a branded logo intro or corporate video outro.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptExample:
      "Create a corporate video intro where the selected Microsoft logo appears from a subtle blur into sharp focus. Optionally finish with the tagline ‘Empowering every person and organization’.",
  },
  {
    id: "ranking.grid",
    legacyType: "top-grid",
    family: "ranking",
    label: "Top Grid",
    description: "Show a visual ranking grid.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptPlaceholder: "Example: Top 10 most popular car brands",
    promptExample:
      "Rank the 6 most popular electric car brands in 2025. Arrange the selected brand images in a grid, reveal positions 6 through 1, and emphasize the winner with a gold border.",
  },
  {
    id: "ranking.list",
    legacyType: "top-list",
    family: "ranking",
    label: "Top List",
    description: "Present an ordered visual list.",
    requiresAssets: 1,
    acceptsAssets: true,
    promptPlaceholder: "Example: Top 10 most valuable companies",
    promptExample:
      "Show the top 5 most valuable technology companies: 5. Broadcom, 4. Amazon, 3. Alphabet, 2. Microsoft, 1. Apple. Animate the list upward and highlight first place.",
  },
];

export const templateCatalog = [
  {
    id: "finance-terminal",
    label: "Finance Terminal",
    theme: "finance",
    families: ["chart", "ranking"],
  },
  {
    id: "bloomberg-terminal",
    label: "Bloomberg Terminal",
    theme: "bloomberg",
    families: ["chart", "map", "structure", "media", "editorial", "branding", "ranking"],
  },
  {
    id: "cnn-newsroom",
    label: "CNN Newsroom",
    theme: "cnn",
    families: ["chart", "map", "structure", "media", "editorial", "branding", "ranking"],
  },
  {
    id: "dw-editorial",
    label: "DW Editorial",
    theme: "dw",
    families: ["chart", "map", "structure", "media", "editorial", "branding", "ranking"],
  },
  {
    id: "bbc-news",
    label: "BBC News",
    theme: "bbc",
    families: ["chart", "map", "structure", "media", "editorial", "branding", "ranking"],
  },
  {
    id: "france24-news",
    label: "France 24",
    theme: "france24",
    families: ["chart", "map", "structure", "media", "editorial", "branding", "ranking"],
  },
  {
    id: "aljazeera-editorial",
    label: "Al Jazeera",
    theme: "aljazeera",
    families: ["chart", "map", "structure", "media", "editorial", "branding", "ranking"],
  },
  {
    id: "corporate-blue",
    label: "Corporate Blue",
    theme: "corporateBlue",
    families: ["chart", "map", "structure", "media", "editorial", "branding", "ranking"],
  },
  {
    id: "editorial-dark",
    label: "Editorial Dark",
    theme: "dark",
    families: ["chart", "map", "structure", "media", "editorial", "branding", "ranking"],
  },
  {
    id: "cinematic",
    label: "Cinematic",
    theme: "netflix",
    families: ["media", "editorial", "branding", "structure", "ranking"],
  },
  {
    id: "minimal-dark",
    label: "Minimal Dark",
    theme: "dark",
    families: animationFamilies.map((family) => family.value),
  },
  {
    id: "minimal-light",
    label: "Minimal Light",
    theme: "light",
    families: animationFamilies.map((family) => family.value),
  },
] satisfies Array<{
  id: string;
  label: string;
  theme: string;
  families: AnimationFamily[];
}>;

export const motionPresetCatalog = [
  {
    id: "smooth",
    label: "Smooth",
    description: "Balanced and polished movement",
    config: { easing: "ease-in-out", intensity: 0.7, staggerFrames: 5 },
  },
  {
    id: "energetic",
    label: "Energetic",
    description: "Fast entrances and stronger emphasis",
    config: { easing: "spring", intensity: 1, staggerFrames: 3 },
  },
  {
    id: "cinematic",
    label: "Cinematic",
    description: "Slow, deliberate reveals",
    config: { easing: "ease-out", intensity: 0.55, staggerFrames: 8 },
  },
  {
    id: "minimal",
    label: "Minimal",
    description: "Subtle motion with low distraction",
    config: { easing: "linear", intensity: 0.35, staggerFrames: 4 },
  },
] as const;

const dataSchema = z.record(z.string(), z.unknown());

export const animationSpecV2Schema = z.object({
  version: z.literal(2),
  family: z.enum([
    "chart",
    "map",
    "structure",
    "media",
    "editorial",
    "branding",
    "ranking",
  ]),
  visualization: z.string().min(1),
  variant: z.string().optional(),
  template: z.string().min(1),
  motionPreset: z.string().min(1),
  type: z.string().min(1),
  title: z.string().default(""),
  data: dataSchema,
  meta: dataSchema.default({}),
  theme: z.string().min(1),
  options: dataSchema.default({}),
  animation: z
    .object({ durationInFrames: z.number().positive() })
    .catchall(z.unknown()),
});

export type AnimationSpecV2 = z.infer<typeof animationSpecV2Schema>;

type AnimationSpecInput = Record<string, unknown> & {
  visualization?: string;
  type?: string;
  template?: string;
  theme?: string;
  motionPreset?: string;
  title?: string;
  data?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  options?: Record<string, unknown>;
  animation?: Record<string, unknown> & { durationInFrames?: number };
};

export function getVisualization(idOrLegacyType: string) {
  return visualizationCatalog.find(
    (item) => item.id === idOrLegacyType || item.legacyType === idOrLegacyType,
  );
}

export function getTemplatesForFamily(family: AnimationFamily) {
  return templateCatalog.filter((template) =>
    template.families.includes(family),
  );
}

export function recommendVisualization(text = "") {
  const normalized = text.toLowerCase();
  if (/https?:\/\//.test(text)) return getVisualization("content.web")!;
  if (/\b(historical|history|timeline|hist[oó]rico|historia|l[ií]nea temporal|expansion|expansi[oó]n territorial)\b/.test(normalized))
    return getVisualization("map.historical-timeline")!;
  if (/\b(migration|migraci[oó]n|refugee|refugiados|displacement|desplazamiento)\b/.test(normalized))
    return getVisualization("map.migration-flow")!;
  if (
    /\b(route|travel|flight|migration|ruta|recorrido|trayectoria)\b/.test(
      normalized,
    )
  )
    return getVisualization("map.route")!;
  if (
    /\b(cities|locations|offices|stores|ciudades|sucursales|oficinas)\b/.test(
      normalized,
    )
  )
    return getVisualization("map.points")!;
  if (/\b(country|nation|pa[ií]s|naci[oó]n|highlight|shade|resaltar|sombrear)\b/.test(normalized))
    return getVisualization("map.country-highlight")!;
  if (/\b(choropleth|coropl[eé]tico|color scale|escala de color|intensity map|mapa de intensidad)\b/.test(normalized))
    return getVisualization("map.choropleth")!;
  if (/\b(compare|comparison|comparar|comparaci[oó]n)\b/.test(normalized) && /\b(country|countries|pa[ií]s|pa[ií]ses)\b/.test(normalized))
    return getVisualization("map.country-comparison")!;
  if (/\b(zoom|acercar|ac[eé]rcate|mundo.*pa[ií]s|world.*country)\b/.test(normalized))
    return getVisualization("map.location-zoom")!;
  if (/\d/.test(text)) {
    if (
      /\b(year|years|month|months|over time|trend|año|años|mes|meses|tendencia)\b/.test(
        normalized,
      )
    )
      return getVisualization("chart.line")!;
    return getVisualization("chart.bar")!;
  }
  return getVisualization("content.fact-card")!;
}

export function getPromptCompatibilityError(
  visualizationId: string,
  prompt: string,
) {
  const visualization = getVisualization(visualizationId);
  if (!visualization) return "Select a supported animation type.";
  if (visualization.family === "chart" && !/\d/.test(prompt)) {
    return "Charts need numeric values. Add numbers to the prompt or choose Content → Editorial Fact.";
  }
  if (
    ["content.web", "content.article"].includes(visualization.id) &&
    !/https?:\/\//.test(prompt)
  ) {
    return "Web and article animations need a complete http:// or https:// URL.";
  }
  return null;
}

export function resolveAnimationSpec(
  input: AnimationSpecInput,
): AnimationSpecV2 {
  const visualizationId = input.visualization || input.type;
  if (!visualizationId) {
    throw new Error("Unsupported animation type: undefined");
  }
  const visualization = getVisualization(visualizationId);
  if (!visualization)
    throw new Error(
      `Unsupported animation type: ${input.visualization || input.type}`,
    );

  const template =
    templateCatalog.find((item) => item.id === input.template) ||
    templateCatalog.find(
      (item) =>
        item.theme === input.theme &&
        item.families.includes(visualization.family),
    ) ||
    getTemplatesForFamily(visualization.family)[0];
  const motion =
    motionPresetCatalog.find((item) => item.id === input.motionPreset) ||
    motionPresetCatalog[0];

  return animationSpecV2Schema.parse({
    ...input,
    version: 2,
    family: visualization.family,
    visualization: visualization.id,
    type: visualization.legacyType,
    template: template.id,
    motionPreset: motion.id,
    theme: template.theme,
    title: input.title || "",
    data: input.data || {},
    meta: input.meta || {},
    options: input.options || {},
    animation: {
      ...(input.animation || {}),
      ...motion.config,
      durationInFrames: Number(input.animation?.durationInFrames || 180),
    },
  });
}

export function buildAnimationCapabilities() {
  return visualizationCatalog.map((item) => ({
    id: item.id,
    legacyType: item.legacyType,
    family: item.family,
    description: item.description,
    requiredAssets: item.requiresAssets || 0,
    templates: getTemplatesForFamily(item.family).map(
      (template) => template.id,
    ),
  }));
}
