export const PROJECTS = [
  {
    id: 1,
    title: "Diesa Analytics",
    tagline: "Plataforma de análisis de datos de instrumentación industrial",
    description:
      "Plataforma web para la visualización, análisis y gestión de datos provenientes de sistemas de instrumentación industrial. Permite monitorear mediciones, descargar información y crear dashboards configurables con diferentes widgets de visualización.",
    tech: ["React", "NestJS", "PostgreSQL"],
    highlights: [
      "Arquitectura Full Stack con React, NestJS y PostgreSQL",
      "Integración con APIs REST para la gestión de datos de instrumentación",
      "Dashboards configurables con widgets de visualización reutilizables",
      "Visualización y descarga de datos de instrumentación",
    ],
    github: "#",
    demo: "https://d1g3nxko5navps.cloudfront.net/es",
    image: "project-diesa",
    accent: "from-indigo-500 via-violet-500 to-fuchsia-500",
  },

  {
    id: 2,
    title: "FiRecords",
    tagline: "Plataforma para el control de gastos de trabajadores",
    description:
      "Aplicación web para registrar y realizar el seguimiento de los gastos de trabajadores durante un mes. Incluye gestión de gastos, almacenamiento de información y un chatbot basado en LLM para interactuar con los datos registrados.",
    tech: ["React", "Firebase", "LLM", "Chatbot"],
    highlights: [
      "Registro y seguimiento mensual de gastos",
      "Interfaz web desarrollada con React",
      "Firebase para almacenamiento y gestión de datos",
      "Chatbot basado en LLM para interactuar con la información",
    ],
    github: "#",
    demo: "https://dbweb2-d46e8.web.app/",
    image: "project-firecords",
    accent: "from-cyan-400 via-sky-500 to-indigo-500",
  },

  {
    id: 3,
    title: "PixHeart",
    tagline: "Editor de imágenes con transformación a Pixel Art",
    description:
      "Aplicación desarrollada en Python para procesar imágenes y generar una versión preliminar con estilo Pixel Art. Utiliza técnicas de procesamiento de imágenes y visión por computadora mediante una interfaz gráfica interactiva.",
    tech: ["Python", "Pillow", "OpenCV", "scikit-learn", "Flet"],
    highlights: [
      "Procesamiento y transformación de imágenes a estilo Pixel Art",
      "Aplicación de técnicas de visión por computadora con OpenCV",
      "Manipulación de imágenes mediante Pillow",
      "Interfaz gráfica interactiva desarrollada con Flet",
    ],
    github: "https://github.com/CarlosCabreraCG/PixelArtEditor",
    demo: "#",
    image: "project-pixelart",
    accent: "from-emerald-400 via-teal-500 to-cyan-500",
  },
];



export const NAV_LINKS = [
  { label: "Perfil",     href: "#home" },
  { label: "Habilidades",   href: "#skills" },
  { label: "Proyectos", href: "#projects" },
  { label: "Contacto",  href: "#contact" },
];