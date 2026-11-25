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
  newtonSchoolHandle: string;
  newtonSchoolUrl: string;
  email: string;
  resumeUrl: string;
}

export interface FeaturedCredentialConfig {
  title: string;
  subtitle: string;
  summary: string;
  postUrl: string;
  embedUrl: string;
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

export interface FlagshipProjectConfig {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  summary: string;
  highlights: {
    title: string;
    detail: string;
  }[];
  status: string;
  stack: string[];
}

export interface ChessPlatformConfig {
  username: string;
  profileUrl: string;
}

export interface ChessConfig {
  headline: string;
  bio: string;
  chessCom: ChessPlatformConfig;
  lichess: ChessPlatformConfig;
}

export interface LinkedInConfig {
  handle: string;
  profileUrl: string;
  headline: string;
  location: string;
  education: string;
  openTo: string[];
  highlights: string[];
}

export interface ProfileConfig {
  identity: IdentityConfig;
  links: LinksConfig;
  chess: ChessConfig;
  linkedin: LinkedInConfig;
  featuredPost: FeaturedCredentialConfig;
  flagshipProject: FlagshipProjectConfig;
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
    role: 'B.Tech CS (AI & ML) · Quant Researcher',
    institution: 'Newton School of Technology, Pune',
    status: 'First-Year Undergraduate · AI/ML, Systems & WorldQuant BRAIN Gold',
    headline: 'Unmesh.',
    tagline: 'building at the intersection of AI, systems & alpha.',
    bio: 'First-year Computer Science (AI & ML) student at Newton School of Technology, Pune, and WorldQuant BRAIN Gold Level Quantitative Researcher. Exploring machine learning, mathematical alpha signals, low-level logic, and tactile software interfaces.',
    location: 'Pune, India',
  },

  links: {
    // Paste your exact GitHub handle below (e.g., "unmeshbhagat") for live GitHub auto-sync
    githubUsername: 'unmesh9073-ops',
    githubUrl: 'https://github.com/unmesh9073-ops',
    linkedinUrl: 'https://www.linkedin.com/in/unmesh-bhagat-096578271/',
    newtonSchoolHandle: 'unmesh9073',
    newtonSchoolUrl: 'https://my.newtonschool.co/user/unmesh9073',
    email: 'unmesh9073@gmail.com',
    resumeUrl: '',
  },

  chess: {
    headline: 'Pattern recognition beyond code.',
    bio: 'Playing rapid and blitz across Chess.com and Lichess to sharpen calculation, endgame precision, and decision-making under time pressure.',
    chessCom: {
      // Automatically lowercased for Chess.com PubAPI requests
      username: 'blank_0000001',
      profileUrl: 'https://www.chess.com/member/blank_0000001',
    },
    lichess: {
      // Case-insensitive Lichess handle for public API requests
      username: 'b_l_n_00',
      profileUrl: 'https://lichess.org/@/b_l_n_00',
    },
  },

  linkedin: {
    handle: 'unmesh-bhagat-096578271',
    profileUrl: 'https://www.linkedin.com/in/unmesh-bhagat-096578271/',
    headline:
      'B.Tech CS (AI & ML) @ Newton School of Technology, Pune · Quant Researcher (WorldQuant BRAIN Gold) · SIH 2026 Builder',
    location: 'Pune, Maharashtra, India',
    education: 'Newton School of Technology, Pune · B.Tech Computer Science (AI & ML)',
    openTo: [
      'AI & ML Internships',
      'Quant Research & Alpha Modeling',
      'Hackathon Collaborations',
      'Systems Engineering',
    ],
    highlights: [
      'WorldQuant BRAIN — Gold Level Quantitative Researcher (10,000+ Points), designing and validating cross-sectional mathematical alpha signals.',
      'First-Year B.Tech CS (AI & ML) undergraduate at Newton School of Technology, Pune.',
      'SIH 2026 Problem Statement #37 — Autonomous Path Planning & Collision Avoidance on Unstructured Indian Roads.',
    ],
  },

  featuredPost: {
    title: 'WorldQuant BRAIN — Gold Level Certificate',
    subtitle: '10,000+ Points · Quantitative Alpha Research',
    summary:
      'Achieved Gold tier on WorldQuant BRAIN by designing, simulating, and validating cross-sectional mathematical alpha signals.',
    postUrl: 'https://lnkd.in/p/d5XCQ5AZ',
    embedUrl:
      'https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:7519627535442399232?collapsed=1',
  },

  flagshipProject: {
    id: 'sih-2026-ps37',
    badge: 'Smart India Hackathon 2026 · Problem Statement #37',
    title: 'Adaptive Path Planning & Collision Avoidance',
    subtitle: 'Autonomous Vehicles on Unstructured Indian Roads',
    summary:
      'Real-time local trajectory planner and dynamic obstacle-avoidance pipeline engineered for unmarked lanes, irregular road edges, and mixed-traffic agents across unstructured Indian road environments.',
    highlights: [
      {
        title: 'Dynamic Obstacle Avoidance',
        detail: 'Continuous spatial occupancy tracking for moving and static hazards with instant corridor clearance.',
      },
      {
        title: 'Unstructured Road Perception',
        detail: 'Drivable-surface boundary estimation without relying on crisp lane markings or uniform curbs.',
      },
      {
        title: 'Real-Time Trajectory Re-planning',
        detail: 'Smooth cubic-spline path synthesis that bends around sudden intrusions while respecting vehicle kinematics.',
      },
      {
        title: 'Edge-Ready Inference',
        detail: 'Deterministic C++ and Python compute loop tuned for low-latency onboard sensor fusion.',
      },
    ],
    status: 'SIH 2026 · Active Build',
    stack: ['C++', 'Python', 'Path Planning', 'LiDAR Fusion', 'Spline Control'],
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
        {
          name: 'Quantitative Research',
          focus: 'Cross-sectional signal hypothesis, backtesting, and factor evaluation on WorldQuant BRAIN',
        },
        {
          name: 'Alpha Modeling',
          focus: 'Statistical neutrality, turnover control, and mathematical expression synthesis',
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
