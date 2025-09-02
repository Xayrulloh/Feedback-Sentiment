# 📊 Customer Feedback Sentiment Dashboard

An AI-powered dashboard to analyze customer feedback sentiment, group themes, and generate reports. Built with NestJS for scalability and Mistral AI for NLP.

---

## 🛠️ Stack

### **Core**

- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL (Drizzle ORM)
- **Auth**: JWT + Redis (sessions/rate-limiting)
- **AI**: Mistral API (Sentiment Analysis + Topic Clustering)

### **Tools**

- **Validation**: Zod + NestJS-Zod
- **API Docs**: Swagger
- **Testing**: Jest + Supertest
- **Linting/Formatting**: Biome
- **File Processing**: Multer (uploads), PapaParse (CSV)
- **Monitoring**: Prometheus + Grafana + Loki
- **Deployment**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **PDF Generation:** PDF-lib
- **CSV Export:** JSON2CSV
- **Real-time:** Socket.IO

---

## 🛠 How to Run

### 1. Clone the repository

```bash
git clone https://github.com/Xayrulloh/Feedback-Sentiment.git && cd Feedback-Sentiment
```

### 2. Create .env file:

```env
DATABASE_URL='postgresql://<user>:<password>@localhost:5432/<database>'
PORT=XXXX

# JWT
JWT_SECRET=

# AI
OPENAI_API_KEY

# POSTGRES
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
POSTGRES_PORT

# Redis
REDIS_HOST
REDIS_PORT
```

### 3. Run Database

```bash
docker compose up -d  # Starts PostgreSQL + Redis
npx drizzle-kit push:pg  # Apply DB schema
```

### 4. Start Server

```bash
pnpm run start:dev
```

### 5. Swagger Docs and server address

- **http://localhost:${PORT}/${GLOBAL_PREFIX}** server address
- **http://localhost:${PORT}/${GLOBAL_PREFIX}/docs** swagger docs

## 🧠 How It Works

### 1. Feedback Ingestion:

- CSV/text feedbacks input → AI Processing → Stored in PostgreSQL.

### 2. AI Processing:

- Mistral API tags sentiment → Groups similar feedback via NLP -> Tells confidence

### 3. Dashboard:

- Filter by sentiment, group themes, download reports, bar charts.

### 4. Admin Dashboard:

- Get users -> Disable users -> Suspend users ->
- Get suspicious activity (Registration/Upload/Download/API)
- Rate limit (API/Upload/Download/Login)

## 🌐 Endpoints

### 🔐 Authentication Endpoints

#### **1. User Registration**

**Path**: `POST /auth/(register|login)`  
**Flow Register/Login**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: POST /auth/register {email, password}
    Backend->>+UserStatusGuard: Check suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>+Websocket: Active users
    Backend->>+Backend: Zod Validation
    Backend->>+DB: Checking email and password
    alt Not valid
        DB-->>-Backend: Error (Incorrect password or Email exist)
        Backend-->>-Frontend: 409 | 401
    else Valid
        Backend->>DB: Hash password, save user (role=user)
        Backend->>Frontend: 201 + JWT
    end
```

#### **2. Admin Registration**

**Path**: `POST /auth/(register|login)/admin`  
**Flow Register/Login**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: POST /auth/register {email, password}
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>+Websocket: Active users
    Backend->>+Backend: Zod Validation
    Backend->>+DB: Checking email and password
    alt Not valid
        DB-->>-Backend: Error (Incorrect password or Email exist)
        Backend-->>-Frontend: 409 | 401
    else Valid
        Backend->>DB: Hash password, save user (role=user)
        Backend->>Frontend: 201 + JWT
    end
```

### 📥 Feedback Endpoints

#### **1. Feedback Manual**

**Path**: `POST /feedback/manual`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: POST /feedback/manual (array of feedbacks)
    Backend->>+UserStatusGuard: Check suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>DB: Check whether it's already exist or not
    alt Exist
        DB-->>-Backend: Get that feedbacks
        Backend-->>-Frontend: 201
    else Create
        Backend->>+AIService: Analyze (confidence/sentiment/group)
        AIService->>+DB: Create new one and return
        DB-->>-AIService: Success
        AIService-->>-Backend: Processed
        Backend-->>-Frontend: 201
    end
```

#### **2. Upload Feedback via CSV**

**Path**: `POST /feedback/upload`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: POST /feedback/upload (file which has array of feedbacks)
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Parsing and Zod Validation
    Backend->>+FeedbackManual: Same happens with manual with the rest
    Backend-->>-Frontend: 201 Created with results
```

#### **3. Get Feedback by ID**

**Path**: `GET /feedback/:id`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /feedback/:id
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+DB: Get feedback by id
    DB-->>-Backend: Feedback
    Backend-->>-Frontend: 200
```

#### **4. Filter Feedback by Sentiment**

**Path**: `GET /feedback`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /feedback?sentiment=positive,negative
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+DB: Query with Sentiment Filters
    DB-->>-Backend: Filtered Results
    Backend-->>-Frontend: 200 (Paginated Data)
```

#### **5. Get Feedback Summary**

**Path**: `GET /feedback/sentiment-summary`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /feedback/sentiment-summary
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+DB: Query with userId
    DB-->>-Backend: Grouped Results
    Backend-->>-Frontend: 200
```

#### **6. Get Feedback Grouped**

**Path**: `GET /feedback/grouped`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /feedback/grouped
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+DB: Query with userId
    DB-->>-Backend: Grouped by summary 
    Backend-->>-Frontend: 200
```

#### **7. Get Feedback Report file (CSV/PDF)**

**Path**: `GET /feedback/report`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /feedback/report
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+DB: Fetch all feedback
    DB-->>-Backend: Raw data
    alt PDF Format
        Backend->>+PDF-lib: Generate PDF
        PDF-lib-->>-Backend: PDF buffer
    else CSV Format
        Backend->>+json2csv: Convert to CSV
        json2csv-->>-Backend: CSV string
    end
    Backend-->>-Frontend: File download
```

### 📁 File Endpoints

#### **1. Get Files**

**Path**: `GET /files`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /files
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+DB: Fetch all user files (Paginated)
    DB-->>-Backend: Files
    Backend-->>-Frontend: 200
```


#### **2. Delete File**

**Path**: `DELETE /files/:id`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: DELETE /files/:id
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+DB: Delete file
    DB-->>-Backend: Deleted
    Backend-->>-Frontend: 200
```

### 🤨 User Endpoints

#### **1. Get Users**

**Path**: `GET /users`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /users
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+DB: Fetch all users (Paginated)
    DB-->>-Backend: Users
    Backend-->>-Frontend: 200
```

#### **2. Search Users**

**Path**: `GET /users/search`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /users/search?email=example
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+DB: Search users by email
    DB-->>-Backend: Users (limit 5)
    Backend-->>-Frontend: 200
```

### 🔒 Admin Endpoints

#### **1. Disable User**

**Path**: `POST /admin/disable/:userId`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: POST /admin/disable/:userId
    Backend->>+Backend: Check the user is admin
    Backend->>+DB: Disable user
    DB-->>-Backend: Disabled
    Backend-->>-Frontend: 200
```

#### **2. Suspend User**

**Path**: `POST /admin/suspend/:userId`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: POST /admin/suspend/:userId
    Backend->>+Backend: Check the user is admin
    Backend->>+DB: Suspend user | Enable user
    DB-->>-Backend: Suspended | Enabled 
    Backend-->>-Frontend: 200
```

#### **3. Metrics**

**Path**: `GET /admin/metrics`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /admin/metrics
    Backend->>+Backend: Check the user is admin
    Backend->>+DB: Take metrics (uploads, api usage, error rates)
    DB-->>-Backend: Metrics
    Backend-->>-Frontend: 200
```

#### **4. Rate Limit**

**Path**: `GET /admin/rate-limit`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /admin/rate-limit
    Backend->>+Backend: Check the user is admin
    Backend->>+DB: Take rate limits (api, upload, download, login)
    DB-->>-Backend: RateLimits
    Backend-->>-Frontend: 200
```

#### **5. Rate Limit**

**Path**: `PATCH /admin/rate-limit`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: PATCH /admin/rate-limit
    Backend->>+Backend: Check the user is admin
    Backend->>+DB: Path rate limits (api, upload, download, login)
    DB-->>-Backend: RateLimits
    Backend-->>-Frontend: 200
```

#### **6. Suspicious Activity**

**Path**: `GET /admin/suspicious-activities`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /admin/suspicious-activities
    Backend->>+Backend: Check the user is admin
    Backend->>+DB: Take suspicious activities
    DB-->>-Backend: SuspiciousActivities
    Backend-->>-Frontend: 200
```

### 📜 Sample Feedback Endpoints

#### **1 Sample. Feedback Manual**

**Path**: `POST /sample/feedback/manual`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: POST /sample/feedback-manual (array of feedbacks)
    Backend->>+UserStatusGuard: Check suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>MockData: Mock feedbacks
    Backend-->>-Frontend: 201
```

#### **2. Sample Get Feedback by ID**

**Path**: `GET /sample/feedback/:id`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /sample/feedback-:id
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+MockData: Mock Feedback
    Backend-->>-Frontend: 200
```

#### **4. Sample Filter Feedback by Sentiment**

**Path**: `GET /feedback`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /feedback?sentiment=positive,negative
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+MockData: Mock Feedback
    Backend-->>-Frontend: 200 (Paginated Data)
```

#### **5. Sample Get Feedback Summary**

**Path**: `GET /sample/feedback-sentiment-summary`  
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /sample/feedback-sentiment-summary
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+MockData: Mock Feedback
    Backend-->>-Frontend: 200
```

#### **6. Sample Get Feedback Grouped**

**Path**: `GET /sample/feedback-grouped`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /sample/feedback-grouped
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+MockData: Mock Feedback
    Backend-->>-Frontend: 200
```

#### **7. Sample Get Feedback Report file (CSV/PDF)**

**Path**: `GET /sample/feedback-report`
**Flow**:

```mermaid
sequenceDiagram
    Frontend->>+Backend: GET /sample/feedback-report
    Backend->>+UserStatusGuard: Check if user suspended/disabled
    Backend->>+RateLimitGuard: Check user rate limits and increment (create activity in suspicious table)
    RateLimitGuard->>+Websocket: Send admins if user hits limits
    Backend->>+MetricsMiddleware: (Api Usage, Error Rates, Uploads)
    Backend->>Backend: Zod Validation
    Backend->>+MockData: Mock Feedback
    Backend-->>-Frontend: File download
```

## 🗃️ Database Schema

```mermaid
erDiagram
    users ||--o{ users_feedbacks : "1:N"
    users ||--o{ files : "1:N"
    users ||--o{ suspicious_activity : "1:N"
    feedbacks ||--o{ users_feedbacks : "1:N"
    files ||--o{ users_feedbacks : "1:N"

    users {
        string id PK "uuid"
        string email "unique"
        string password_hash
        enum role "user|admin"
        boolean is_suspended
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "nullable"
    }

    feedbacks {
        string id PK "uuid"
        string content_hash "unique, sha256"
        text content
        enum sentiment "positive|neutral|negative|unknown"
        integer confidence "0-100"
        text summary "AI-generated"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "nullable"
    }

    users_feedbacks {
        string user_id FK,PK
        string feedback_id FK,PK
        string file_id FK "nullable"
        timestamp created_at
    }

    files {
        string id PK "uuid"
        string user_id FK
        string name
        string mime_type
        bigint size "bytes"
        integer row_count "nullable"
        string extension
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "nullable"
    }

    rate_limits {
        string id PK "uuid"
        enum target "api|upload|download|login"
        integer limit
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "nullable"
    }

    suspicious_activity {
        string id PK "uuid"
        string user_id FK "nullable"
        string email "nullable"
        string ip "nullable"
        enum action "api|upload|download|login"
        enum error "too_many_*"
        text details "nullable"
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at "nullable"
    }
```

