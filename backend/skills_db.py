"""
skills_db.py
────────────
Single source of truth for all technical skill keywords.
Imported by both parser.py and jd_matcher.py to guarantee consistency
across the entire NLP pipeline.
"""

SKILL_KEYWORDS = [
    # ── Programming Languages ──────────────────────────────────────────────
    "Python", "Java", "C++", "C#", "C", "JavaScript", "TypeScript",
    "Go", "Golang", "Rust", "Swift", "Kotlin", "Ruby", "PHP",
    "Scala", "R", "MATLAB", "Perl", "Haskell", "Dart", "Objective-C",
    "Lua", "Julia", "Groovy", "Elixir", "Erlang", "Clojure", "F#",
    "Bash", "Shell", "PowerShell", "VBA", "COBOL", "Fortran", "Assembly",
    "Solidity", "Move", "Cairo",

    # ── Web Frontend ──────────────────────────────────────────────────────
    "React", "Next.js", "Vue", "Vue.js", "Angular", "Svelte",
    "SvelteKit", "Astro", "Remix", "Nuxt.js", "Gatsby",
    "HTML", "HTML5", "CSS", "CSS3", "SASS", "LESS", "Tailwind",
    "TailwindCSS", "Bootstrap", "Material UI", "Chakra UI", "Radix UI",
    "shadcn", "Webpack", "Vite", "Rollup", "Parcel", "Babel",
    "Redux", "Zustand", "MobX", "Recoil", "Jotai",
    "GraphQL", "REST", "REST API", "WebSocket", "gRPC", "tRPC",
    "Framer Motion", "GSAP", "Three.js", "WebGL", "WebAssembly", "WASM",

    # ── Web Backend ───────────────────────────────────────────────────────
    "Node.js", "Express", "Fastify", "NestJS", "Hono", "Koa",
    "FastAPI", "Flask", "Django", "Starlette", "Tornado", "Litestar",
    "Spring Boot", "Spring", "Quarkus", "Micronaut",
    "Laravel", "Symfony", "Rails", "Ruby on Rails",
    "Gin", "Fiber", "Echo", "Chi",
    "ASP.NET", ".NET", "Blazor",

    # ── AI / ML / Data Science ───────────────────────────────────────────
    "TensorFlow", "PyTorch", "Scikit-learn", "Keras", "JAX",
    "OpenCV", "Pandas", "NumPy", "Matplotlib", "Seaborn", "Plotly",
    "NLTK", "SpaCy", "Gensim", "TextBlob",
    "Hugging Face", "Transformers", "LangChain", "LangGraph",
    "LlamaIndex", "Gemini", "OpenAI", "Anthropic", "Cohere", "Mistral",
    "GPT", "GPT-4", "Claude", "Llama", "BERT", "RoBERTa", "T5",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Reinforcement Learning", "Data Science", "Data Analysis",
    "Data Engineering", "Neural Network", "LLM", "RAG",
    "Vector Database", "Pinecone", "Weaviate", "Chroma", "Qdrant", "Milvus",
    "XGBoost", "LightGBM", "CatBoost", "Random Forest",
    "Linear Regression", "Logistic Regression", "CNN", "RNN", "LSTM",
    "GAN", "Diffusion Models", "Stable Diffusion", "AutoML",
    "MLflow", "Weights & Biases", "DVC", "Feature Engineering",
    "A/B Testing", "Statistical Analysis", "Bayesian Inference",

    # ── Cloud / DevOps ───────────────────────────────────────────────────
    "Docker", "Kubernetes", "Helm", "ArgoCD", "Flux",
    "AWS", "Azure", "GCP", "Google Cloud", "Oracle Cloud", "IBM Cloud",
    "Terraform", "Pulumi", "Ansible", "Chef", "Puppet",
    "Jenkins", "GitHub Actions", "GitLab CI", "CircleCI", "Travis CI",
    "CI/CD", "DevOps", "SRE", "Linux", "Unix",
    "Nginx", "Apache", "Traefik", "Caddy",
    "Microservices", "Serverless", "Lambda", "Cloud Functions",
    "EC2", "S3", "RDS", "EKS", "ECS", "CloudFormation", "CDK",
    "App Engine", "Cloud Run", "GKE", "BigTable", "Spanner",
    "Azure Functions", "AKS", "CosmosDB",
    "Istio", "Envoy", "Service Mesh", "Prometheus", "Grafana",
    "Datadog", "New Relic", "Splunk", "ELK Stack", "Kibana",

    # ── Databases ─────────────────────────────────────────────────────────
    "SQL", "MySQL", "PostgreSQL", "SQLite", "MariaDB", "Oracle",
    "MongoDB", "Redis", "Elasticsearch", "DynamoDB", "Cassandra",
    "Neo4j", "Supabase", "Firebase", "Firestore",
    "Prisma", "SQLAlchemy", "TypeORM", "Drizzle",
    "InfluxDB", "TimescaleDB", "ClickHouse", "Snowflake",
    "BigQuery", "Redshift", "Databricks", "Hive", "HBase",

    # ── Data Engineering ─────────────────────────────────────────────────
    "Spark", "PySpark", "Hadoop", "Kafka", "Airflow", "Prefect",
    "dbt", "Fivetran", "Stitch", "Luigi",
    "ETL", "ELT", "Data Pipeline", "Data Warehouse", "Data Lake",
    "Delta Lake", "Apache Flink", "Apache Beam", "Apache NiFi",

    # ── Tools & Practices ────────────────────────────────────────────────
    "Git", "GitHub", "GitLab", "Bitbucket",
    "Jira", "Confluence", "Notion", "Linear", "Asana",
    "Agile", "Scrum", "Kanban", "SAFe",
    "Figma", "Sketch", "Adobe XD", "Zeplin",
    "Postman", "Insomnia", "Swagger", "OpenAPI",
    "VS Code", "IntelliJ", "PyCharm", "Vim", "Neovim",
    "Selenium", "Pytest", "Jest", "Vitest", "Cypress", "Playwright",
    "JUnit", "Mockito", "TestNG",
    "SonarQube", "ESLint", "Prettier", "Black", "Ruff",

    # ── Mobile ───────────────────────────────────────────────────────────
    "React Native", "Flutter", "Android", "iOS",
    "Expo", "Xcode", "Android Studio",
    "SwiftUI", "Jetpack Compose", "Kotlin Multiplatform",

    # ── Security ─────────────────────────────────────────────────────────
    "Cybersecurity", "OAuth", "OAuth2", "JWT", "SSL", "TLS",
    "Penetration Testing", "OWASP", "Encryption", "PKI",
    "Zero Trust", "IAM", "SIEM", "SOC",

    # ── Analytics & BI ───────────────────────────────────────────────────
    "Tableau", "Power BI", "Looker", "Metabase", "Superset", "Grafana",
    "Google Analytics", "Amplitude", "Mixpanel", "Segment",

    # ── Architecture & Patterns ──────────────────────────────────────────
    "API", "SDK", "CLI", "OOP", "Functional Programming",
    "System Design", "Distributed Systems", "Event-Driven Architecture",
    "CQRS", "Event Sourcing", "Domain-Driven Design", "DDD",
    "Concurrency", "Multithreading", "Async", "Reactive Programming",
    "Design Patterns", "Clean Architecture", "Hexagonal Architecture",

    # ── Blockchain / Web3 ─────────────────────────────────────────────────
    "Blockchain", "Ethereum", "Solidity", "Web3.js", "Ethers.js",
    "Hardhat", "Foundry", "DeFi", "NFT", "Smart Contracts",
]

# Deduplicate while preserving order
_seen = set()
SKILL_KEYWORDS = [
    x for x in SKILL_KEYWORDS
    if not (x.lower() in _seen or _seen.add(x.lower()))
]
