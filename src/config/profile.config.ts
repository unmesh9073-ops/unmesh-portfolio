export type ThemeMode = 'dark' | 'light';

export interface IdentityConfig {
  name: string;
  role: string;
  institution: string;
  status: string;
  headline: string;
  tagline: string;
  bio: string;
  location?: string;
}

export interface LinksConfig {
  /**
   * Paste your GitHub username below to enable live GitHub repository auto-sync
   * across #work (featuredTopic) and #lab (labTopics) in upcoming phases.
   */
  githubUsername: string;
  githubUrl: string;
  linkedinUrl: string;
  email: string;
  resumeUrl: string;
}

export interface SkillItem {
  name: string;
  focus: string;
}

export interface SkillTrack {
  id: string;
  track: string;
  subtitle: string;
  mode: 'core' | 'exploring';
  items: SkillItem[];
}

export interface ProjectItem {
  id: string;
  title: string;
  domain: string;
  summary: string;
  stack: string[];
  topic: string;
  repoUrl?: string;
  liveUrl?: string;
  status?: string;
}

export interface LabItem {
  id: string;
  title: string;
  topic: string;
  summary: string;
  stack: string[];
  status: string;
  repoUrl?: string;
}

export interface ExperienceItem {
  id: string;
  role: string;
  organization: string;
  period: string;
  location?: string;
  summary: string;
  highlights?: string[];
}

export interface NoteItem {
  id: string;
  title: string;
  publishedAt: string;
  topic: string;
  readingTime: string;
  summary: string;
  url?: string;
}

export interface ModulesConfig {
  showExperience: boolean;
  showResearchNotes: boolean;
  showResume: boolean;
}

export interface GitHubSyncConfig {
  featuredTopic: string;
  labTopics: string[];
}

export interface ProfileConfig {
  identity: IdentityConfig;
  links: LinksConfig;
  skills: SkillTrack[];
  featuredBuilds: ProjectItem[];
  labExperiments: LabItem[];
  experience: ExperienceItem[];
  notes: NoteItem[];
  modules: ModulesConfig;
  githubSync: GitHubSyncConfig;
}

export const profileConfig: ProfileConfig = {
  identity: {
    name: 'Unmesh',
    role: 'B.Tech CS (AI & ML)',
    institution: 'Newton School of Technology, Pune',
    status: 'First-Year Undergraduate · Building in AI, ML & Systems',
    headline: 'Unmesh.',
    tagline: 'still figuring out',
    bio: 'First-year Computer Science (AI & ML) student at Newton School of Technology, Pune. Exploring machine learning, low-level logic, and tactile software interfaces.',
    location: 'Pune, India',
  },

  links: {
    // Paste your exact GitHub handle below (e.g., "unmeshbhagat") for live GitHub auto-sync
    githubUsername: 'unmesh9073-ops',
    githubUrl: 'https://github.com/unmesh9073-ops',
    linkedinUrl: 'https://www.linkedin.com/in/unmesh-bhagat-096578271/',
    email: 'unmesh9073@gmail.com',
    resumeUrl: '',
  },

  skills: [
    {
      id: 'systems-logic',
      track: 'Systems & Logic',
      subtitle: 'Core languages for computation, structure, and algorithmic problem solving.',
      mode: 'core',
      items: [
        {
          name: 'Python',
          focus: 'Numerical experimentation, scripting, and foundational ML workflows',
        },
        {
          name: 'C++',
          focus: 'Memory discipline, deterministic logic, and STL primitives',
        },
      ],
    },
    {
      id: 'web-interfaces',
      track: 'Web & Interfaces',
      subtitle: 'Standards-based markup, optical styling, and interactive runtime behavior.',
      mode: 'core',
      items: [
        {
          name: 'HTML',
          focus: 'Accessible semantic structure and document hierarchy',
        },
        {
          name: 'CSS',
          focus: 'Responsive grid layout, typography, and translucent surfaces',
        },
        {
          name: 'JavaScript',
          focus: 'Event-driven DOM logic, asynchronous state, and UI engineering',
        },
      ],
    },
    {
      id: 'exploring',
      track: 'Exploring',
      subtitle: 'Active first-year frontiers shaping upcoming projects and research.',
      mode: 'exploring',
      items: [
        {
          name: 'Machine Learning',
          focus: 'Gradient optimization, linear models, and neural representations',
        },
        {
          name: 'Data Structures & Algorithms',
          focus: 'Complexity analysis, recursion, trees, and graph traversal',
        },
      ],
    },
  ],

  featuredBuilds: [
    {
      id: 'spatial-portfolio-engine',
      title: 'Spatial Portfolio Architecture',
      domain: 'Interface Engineering',
      summary:
        'A configuration-driven personal engineering environment built to evolve across four years of undergraduate study and research.',
      stack: ['TypeScript', 'React', 'Tailwind CSS', 'Framer Motion'],
      topic: 'featured',
      status: 'Active Foundation',
    },
    {
      id: 'algorithmic-foundations',
      title: 'Algorithmic Foundations',
      domain: 'Low-Level Logic',
      summary:
        'First-principles implementations of core data structures, sorting invariants, and graph search routines in C++ and Python.',
      stack: ['C++', 'Python', 'Algorithms'],
      topic: 'featured',
      status: 'Ongoing Coursework',
    },
    {
      id: 'vector-calculus-toolkit',
      title: 'Matrix & Vector Kernel',
      domain: 'Numerical Computing',
      summary:
        'Lightweight linear algebra routines written without high-level wrappers to build intuition for machine learning internals.',
      stack: ['Python', 'Linear Algebra'],
      topic: 'featured',
      status: 'In Progress',
    },
  ],

  labExperiments: [
    {
      id: 'gradient-descent-visual',
      title: 'Optimization & Loss Landscapes',
      topic: 'ml',
      summary:
        'Studying step-size stability, momentum behavior, and convergence diagnostics on synthetic regression surfaces.',
      stack: ['Python', 'Calculus'],
      status: 'Lab Note 01',
    },
    {
      id: 'neural-volume-stage',
      title: '3D Neural Volume Primitive',
      topic: 'ai-ml',
      summary:
        'Spatial WebGL stage architecture designed for interactive node-topology and embedding visualizations.',
      stack: ['WebGL', 'Three.js', 'Spatial UI'],
      status: 'Stage Ready',
    },
    {
      id: 'semantic-similarity-probe',
      title: 'Cosine Geometry & Indexing',
      topic: 'ai',
      summary:
        'Exploring vector normalization, dot-product retrieval speed, and compact inverted index patterns.',
      stack: ['Python', 'C++'],
      status: 'Exploratory',
    },
  ],

  // Lifelong expansion: flip `modules.showExperience` to `true` and uncomment/add entries below.
  experience: [
    /*
    {
      id: 'ai-systems-intern-2027',
      role: 'Machine Learning Engineering Intern',
      organization: 'Example Research Lab',
      period: 'May 2027 — Jul 2027',
      location: 'Bengaluru / Remote',
      summary:
        'Built evaluation pipelines and optimized inference latency for lightweight domain models.',
      highlights: [
        'Reduced batch preprocessing overhead using vectorized Python pipelines.',
        'Instrumented benchmark regression checks across model checkpoints.',
      ],
    },
    */
  ],

  // Lifelong expansion: flip `modules.showResearchNotes` to `true` and uncomment/add entries below.
  notes: [
    /*
    {
      id: 'why-backprop-is-chain-rule',
      title: 'Computational Graphs and Reverse-Mode Differentiation',
      publishedAt: '2027-02',
      topic: 'Machine Learning',
      readingTime: '6 min read',
      summary:
        'Deriving reverse-mode autodiff from scratch in 80 lines of Python to understand gradient accumulation.',
      url: '',
    },
    */
  ],

  modules: {
    showExperience: false,
    showResearchNotes: false,
    showResume: false,
  },

  githubSync: {
    featuredTopic: 'featured',
    labTopics: ['ai-ml', 'lab', 'ml', 'ai'],
  },
};
