# API Documentation - Document Upload and Quiz Generation

This document describes the new API endpoints for uploading documents and generating quizzes using OpenAI.

## Table of Contents
- [Overview](#overview)
- [Configuration](#configuration)
- [Endpoints](#endpoints)
  - [Document Upload](#document-upload)
  - [Generate Quiz](#generate-quiz)
- [Security](#security)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Overview

The platform now supports:
1. **Document Upload**: Upload PDF, DOCX, or TXT files and extract their text content
2. **Quiz Generation**: Generate educational quiz questions from text using OpenAI API

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# OpenAI API Key for quiz generation
OPENAI_API_KEY=your-openai-api-key-here
```

### Settings

The following settings can be configured in `config/settings.py`:

- `MAX_UPLOAD_SIZE`: Maximum file size (default: 10 MB)
- `ALLOWED_UPLOAD_EXTENSIONS`: Allowed file types (default: `.pdf`, `.docx`, `.txt`)
- `MAX_TEXT_LENGTH`: Maximum text length for extraction (default: 10,000 characters)
- `OPENAI_PROMPT_TEXT_LENGTH`: Maximum text length for OpenAI prompts (default: 3,000 characters)
- `OPENAI_TIMEOUT`: Timeout for OpenAI API calls (default: 30 seconds)

## Endpoints

### Document Upload

**Endpoint:** `POST /api/upload/`

**Authentication:** Required (JWT token)

**Content-Type:** `multipart/form-data`

**Parameters:**
- `file`: The document file to upload (PDF, DOCX, or TXT)

**Supported File Types:**
- `.pdf` - PDF documents
- `.docx` - Microsoft Word documents
- `.txt` - Plain text files

**Response:**
```json
{
    "text": "Extracted text content...",
    "filename": "document.pdf",
    "file_type": ".pdf",
    "text_length": 1234,
    "truncated": false
}
```

**Response Fields:**
- `text`: Extracted text content from the document
- `filename`: Original filename
- `file_type`: File extension
- `text_length`: Length of extracted text in characters
- `truncated`: Whether the text was truncated due to size limits

**Error Responses:**

- `400 Bad Request`: Invalid file, unsupported format, or file too large
- `401 Unauthorized`: Missing or invalid authentication token
- `500 Internal Server Error`: Error during text extraction

### Generate Quiz

**Endpoint:** `POST /api/generate-quiz/`

**Authentication:** Required (JWT token)

**Content-Type:** `application/json`

**Parameters:**
```json
{
    "text": "Text content for quiz generation",
    "num_questions": 5
}
```

**Request Fields:**
- `text` (required): Text content to generate quiz questions from
- `num_questions` (optional): Number of questions to generate (1-10, default: 5)

**Response:**
```json
{
    "questions": "Question 1: What is Python?\nA. A snake\nB. A programming language (Correct)\nC. A framework\nD. A database\n\nQuestion 2: ...",
    "num_questions": 5,
    "model": "gpt-3.5-turbo"
}
```

**Response Fields:**
- `questions`: Generated quiz questions in formatted text
- `num_questions`: Number of questions generated
- `model`: OpenAI model used for generation

**Error Responses:**

- `400 Bad Request`: Missing text or invalid number of questions
- `401 Unauthorized`: Missing or invalid authentication token
- `429 Too Many Requests`: OpenAI API rate limit exceeded
- `500 Internal Server Error`: OpenAI API key not configured or other errors
- `504 Gateway Timeout`: OpenAI API timeout

## Security

### File Upload Security

1. **File Size Validation**: Files exceeding 10 MB are rejected
2. **File Type Restriction**: Only `.pdf`, `.docx`, and `.txt` files are accepted
3. **Text Length Limiting**: Extracted text is limited to 10,000 characters
4. **Authentication Required**: All endpoints require valid JWT authentication

### API Key Security

- The OpenAI API key must be stored in environment variables, never in code
- The API key is not exposed in API responses
- All API calls have timeout protection (30 seconds)

### Error Handling

The API implements comprehensive error handling for:
- Authentication errors
- File validation errors
- Text extraction errors
- OpenAI API errors (authentication, rate limits, timeouts)

## Examples

### Example 1: Upload a PDF Document

```bash
# Get authentication token
TOKEN=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "user", "password": "pass"}' | jq -r '.tokens.access')

# Upload PDF file
curl -X POST http://localhost:8000/api/upload/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf"
```

### Example 2: Upload a Text File

```bash
curl -X POST http://localhost:8000/api/upload/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@notes.txt"
```

### Example 3: Generate Quiz from Text

```bash
# First, extract text from a document
RESPONSE=$(curl -s -X POST http://localhost:8000/api/upload/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf")

# Extract the text field
TEXT=$(echo $RESPONSE | jq -r '.text')

# Generate quiz questions
curl -X POST http://localhost:8000/api/generate-quiz/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$TEXT\", \"num_questions\": 5}"
```

### Example 4: Combined Workflow with Python

```python
import requests

# Configuration
BASE_URL = "http://localhost:8000/api"
USERNAME = "formateur1"
PASSWORD = "password123"

# Login
response = requests.post(f"{BASE_URL}/auth/login/", json={
    "username": USERNAME,
    "password": PASSWORD
})
token = response.json()["tokens"]["access"]
headers = {"Authorization": f"Bearer {token}"}

# Upload document
with open("course.pdf", "rb") as f:
    response = requests.post(
        f"{BASE_URL}/upload/",
        headers=headers,
        files={"file": f}
    )
    
text = response.json()["text"]
print(f"Extracted {len(text)} characters")

# Generate quiz
response = requests.post(
    f"{BASE_URL}/generate-quiz/",
    headers=headers,
    json={
        "text": text,
        "num_questions": 5
    }
)

questions = response.json()["questions"]
print("Generated Quiz:")
print(questions)
```

### Example 5: Error Handling

```python
import requests

headers = {"Authorization": f"Bearer {token}"}

# Handle file size error
try:
    with open("large_file.pdf", "rb") as f:
        response = requests.post(
            f"{BASE_URL}/upload/",
            headers=headers,
            files={"file": f}
        )
        response.raise_for_status()
except requests.exceptions.HTTPError as e:
    if response.status_code == 400:
        print(f"Upload error: {response.json()['error']}")

# Handle quiz generation error
try:
    response = requests.post(
        f"{BASE_URL}/generate-quiz/",
        headers=headers,
        json={"text": "Sample text", "num_questions": 15}
    )
    response.raise_for_status()
except requests.exceptions.HTTPError as e:
    if response.status_code == 400:
        print(f"Quiz error: {response.json()['error']}")
```

## Testing

Run the test suite:

```bash
cd backend
python manage.py test pedagogical.tests
```

The test suite includes:
- Document upload tests (txt, pdf, docx)
- File validation tests (size, type)
- Authentication tests
- Quiz generation tests
- Error handling tests

## Integration Notes

### Frontend Integration

To integrate these endpoints in the frontend:

1. **Upload Form**: Create a file upload form with drag-and-drop support
2. **Text Preview**: Display extracted text before quiz generation
3. **Quiz Display**: Format and display generated questions
4. **Error Handling**: Show user-friendly error messages
5. **Loading States**: Show progress indicators during upload/generation

### Workflow Example

1. User uploads a document (PDF/DOCX/TXT)
2. Backend extracts text and returns it
3. User reviews extracted text
4. User clicks "Generate Quiz" button
5. Backend sends text to OpenAI and returns questions
6. Frontend displays formatted quiz questions

## Troubleshooting

### "Clé API OpenAI non configurée"
- Ensure `OPENAI_API_KEY` is set in your `.env` file
- Restart the Django server after adding the key

### "Format non supporté"
- Check that the file extension is `.pdf`, `.docx`, or `.txt`
- Ensure the file has the correct extension

### "Fichier trop volumineux"
- Maximum file size is 10 MB
- Consider splitting large documents or adjusting `MAX_UPLOAD_SIZE` in settings

### OpenAI API Errors
- Check your OpenAI API key is valid
- Ensure you have sufficient API credits
- Check for rate limit issues (status code 429)

## Further Resources

- [Django REST Framework Documentation](https://www.django-rest-framework.org/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [PyPDF2 Documentation](https://pypdf2.readthedocs.io/)
- [python-docx Documentation](https://python-docx.readthedocs.io/)
