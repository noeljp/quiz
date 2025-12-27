# API Documentation - Document Upload and Quiz Generation

This document describes the new endpoints for document upload and quiz generation functionality.

## Prerequisites

1. You must have a valid OpenAI API key configured in your environment variables
2. Add `OPENAI_API_KEY=your-api-key-here` to your `.env` file
3. Only users with `formateur` (trainer) role can access these endpoints

## Endpoints

### 1. Document Upload and Text Extraction

**Endpoint:** `POST /api/documents/upload/`

**Description:** Upload a document (PDF, DOCX, or TXT) and extract text from it.

**Authentication:** Required (Bearer Token)

**Authorization:** Only `formateur` users

**Request Format:** `multipart/form-data`

**Parameters:**
- `file` (required): The document file to upload

**Supported Formats:**
- PDF (.pdf)
- Microsoft Word (.docx)
- Plain Text (.txt)

**File Size Limit:** 10 MB

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/documents/upload/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "file=@/path/to/document.pdf"
```

**Success Response (200 OK):**
```json
{
  "text": "Extracted text content from the document...",
  "filename": "document.pdf",
  "size": 12345,
  "message": "Texte extrait avec succès"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid file format or no file provided
```json
{
  "error": "Format non supporté. Formats acceptés: .pdf, .docx, .txt"
}
```

- `403 Forbidden`: User is not a formateur
```json
{
  "error": "Seuls les formateurs peuvent téléverser des documents"
}
```

- `500 Internal Server Error`: Error during text extraction
```json
{
  "error": "Erreur lors de l'extraction du texte: [error details]"
}
```

---

### 2. Quiz Generation with OpenAI

**Endpoint:** `POST /api/quiz/generate/`

**Description:** Generate quiz questions from provided text using OpenAI's GPT model.

**Authentication:** Required (Bearer Token)

**Authorization:** Only `formateur` users

**Request Format:** `application/json`

**Parameters:**
- `text` (required, string): The text content to generate quiz from
- `num_questions` (optional, integer): Number of questions to generate (default: 5, min: 1, max: 20)

**Example Request:**
```bash
curl -X POST http://localhost:8000/api/quiz/generate/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Python is a high-level programming language. It was created by Guido van Rossum and released in 1991...",
    "num_questions": 5
  }'
```

**Success Response (200 OK):**
```json
{
  "quiz": {
    "questions": [
      {
        "question": "Who created Python?",
        "options": {
          "A": "Guido van Rossum",
          "B": "Dennis Ritchie",
          "C": "James Gosling",
          "D": "Bjarne Stroustrup"
        },
        "correct_answer": "A",
        "explanation": "Python was created by Guido van Rossum and released in 1991."
      }
    ]
  },
  "message": "Quiz généré avec succès"
}
```

**Alternative Success Response (if JSON parsing fails):**
```json
{
  "quiz_text": "Generated quiz in plain text format...",
  "message": "Quiz généré avec succès (format texte)"
}
```

**Error Responses:**

- `400 Bad Request`: Invalid input parameters
```json
{
  "error": "Aucun texte fourni"
}
```
```json
{
  "error": "Le nombre de questions doit être entre 1 et 20"
}
```

- `401 Unauthorized`: Invalid OpenAI API key
```json
{
  "error": "Erreur d'authentification avec l'API OpenAI. Vérifiez votre clé API."
}
```

- `403 Forbidden`: User is not a formateur
```json
{
  "error": "Seuls les formateurs peuvent générer des quiz"
}
```

- `429 Too Many Requests`: OpenAI rate limit exceeded
```json
{
  "error": "Limite de taux dépassée pour l'API OpenAI. Réessayez plus tard."
}
```

- `500 Internal Server Error`: OpenAI API key not configured or other errors
```json
{
  "error": "Clé API OpenAI non configurée"
}
```

---

## Complete Workflow Example

Here's a complete example showing how to use both endpoints together:

```bash
# Step 1: Login as a formateur
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "formateur1",
    "password": "your_password"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.access')

# Step 2: Upload a document and extract text
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8000/api/documents/upload/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cours_python.pdf")

EXTRACTED_TEXT=$(echo $UPLOAD_RESPONSE | jq -r '.text')

# Step 3: Generate quiz from the extracted text
QUIZ_RESPONSE=$(curl -s -X POST http://localhost:8000/api/quiz/generate/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$EXTRACTED_TEXT\",
    \"num_questions\": 5
  }")

echo $QUIZ_RESPONSE | jq '.'
```

---

## Security Considerations

1. **File Upload Security:**
   - Maximum file size: 10 MB
   - Only specific file formats allowed: PDF, DOCX, TXT
   - Files are validated before processing

2. **API Key Protection:**
   - OpenAI API key should be stored in environment variables, not in code
   - Never commit API keys to version control

3. **Text Length Limits:**
   - Text is automatically truncated to 3000 characters to prevent excessive API costs
   - This limit can be adjusted in the settings

4. **Rate Limiting:**
   - Consider implementing additional rate limiting for production use
   - OpenAI has its own rate limits that should be monitored

---

## Testing

Run the test suite to validate the endpoints:

```bash
cd backend
python manage.py test pedagogical.tests
```

This will run all tests including:
- Document upload tests (authentication, file formats, size limits)
- Quiz generation tests (input validation, permission checks)
