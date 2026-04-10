# API Endpoints Documentation

Base URL: `/api`

All protected endpoints require authentication via **HTTP-only cookie** (`accessToken`) set during login. Token expiry and rotation details are described in each section.

---

## Table of Contents

- [Health](#health)
- [Authentication](#authentication)
  - [POST /auth/login](#post-authlogin)
  - [POST /auth/logout](#post-authlogout)
  - [POST /auth/refresh](#post-authrefresh)
  - [GET /auth/validate](#get-authvalidate)
- [Business](#business)
  - [GET /business](#get-business)
  - [POST /business](#post-business)
  - [PATCH /business/:id](#patch-businessid)
  - [DELETE /business/:id](#delete-businessid)
- [Invoices](#invoices)
  - [GET /invoice/:id](#get-invoiceid)
  - [GET /invoice/by-number](#get-invoiceby-number)
- [Listing](#listing)
  - [GET /list/income](#get-listincome)
  - [GET /list/expense](#get-listexpense)
- [Saving Records](#saving-records)
  - [POST /save-income](#post-save-income)
  - [POST /save-expense](#post-save-expense)
- [File Uploads](#file-uploads)
  - [POST /upload-income](#post-upload-income)
  - [POST /upload-expense](#post-upload-expense)
  - [POST /upload-file](#post-upload-file)
  - [POST /upload-to-minio](#post-upload-to-minio)
- [File Downloads](#file-downloads)
  - [GET /download/:filename](#get-downloadfilename)

---

## Health

### GET /health

Public endpoint. Returns the current health status of the application.

**Authentication:** None

**Response `200 OK`**

```json
{ "status": "ok" }
```

---

## Authentication

Tokens are issued as both JSON response body values and HTTP-only cookies. Clients that cannot read HTTP-only cookies (e.g. mobile apps or external API consumers) can use the body values explicitly. Browser-based clients benefit from automatic cookie handling.

| Token         | Lifetime   | Cookie name    |
| ------------- | ---------- | -------------- |
| Access token  | 15 minutes | `accessToken`  |
| Refresh token | 7 days     | `refreshToken` |

---

### POST /auth/login

Authenticates a user and issues a new token pair.

**Authentication:** None

**Request body**

```json
{
  "username": "string", // required
  "password": "string" // required
}
```

**Response `200 OK`**

```json
{
  "accessToken": "string",
  "refreshToken": "string",
  "user": {
    "id": "string",
    "username": "string"
  }
}
```

Sets `accessToken` (15 min) and `refreshToken` (7 days) as `httpOnly`, `sameSite: lax` cookies.

**Error responses**

| Status | Body                                                | Reason                         |
| ------ | --------------------------------------------------- | ------------------------------ |
| `400`  | `{ "error": "Username and password are required" }` | Missing fields                 |
| `401`  | `{ "error": "Invalid credentials" }`                | Unknown user or wrong password |
| `500`  | `{ "error": "Internal server error" }`              | Unexpected server error        |

---

### POST /auth/logout

Invalidates the current session by clearing the stored refresh token and deleting both cookies.

**Authentication:** `Authorization: Bearer <accessToken>` header (required)

**Request body:** Empty

**Response `200 OK`**

```json
{ "message": "Logged out successfully" }
```

Clears `accessToken` and `refreshToken` cookies.

**Error responses**

| Status | Body                                   | Reason                      |
| ------ | -------------------------------------- | --------------------------- |
| `401`  | `{ "error": "Unauthorized" }`          | Missing or malformed header |
| `401`  | `{ "error": "Invalid token" }`         | Token could not be verified |
| `500`  | `{ "error": "Internal server error" }` | Unexpected server error     |

---

### POST /auth/refresh

Rotates the token pair. Accepts the refresh token from either the request body or the `refreshToken` cookie.

**Authentication:** Refresh token (body or cookie)

**Request body** _(optional if cookie is present)_

```json
{
  "refreshToken": "string"
}
```

**Response `200 OK`**

```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

Sets fresh `accessToken` (15 min) and `refreshToken` (7 days) cookies.

**Error responses**

| Status | Body                                              | Reason                            |
| ------ | ------------------------------------------------- | --------------------------------- |
| `400`  | `{ "error": "Refresh token is required" }`        | No token in body or cookie        |
| `401`  | `{ "error": "Invalid or expired refresh token" }` | Signature invalid or expired      |
| `401`  | `{ "error": "Invalid refresh token" }`            | Token does not match stored value |
| `401`  | `{ "error": "Refresh token expired" }`            | `tokenExpiry` in DB exceeded      |
| `500`  | `{ "error": "Internal server error" }`            | Unexpected server error           |

---

### GET /auth/validate

Validates an access token and returns the associated user identity. Useful for checking session state on the client.

**Authentication:** `Authorization: Bearer <accessToken>` header (required)

**Response `200 OK`**

```json
{
  "valid": true,
  "user": {
    "id": "string",
    "username": "string"
  }
}
```

**Error responses**

| Status | Body                                      | Reason                       |
| ------ | ----------------------------------------- | ---------------------------- |
| `401`  | `{ "error": "No token provided" }`        | Missing Authorization header |
| `401`  | `{ "error": "Invalid or expired token" }` | Token invalid or expired     |
| `401`  | `{ "error": "Token validation failed" }`  | Unexpected validation error  |

---

## Business

All business endpoints authenticate via the `accessToken` **cookie**.

A user may belong to multiple businesses. Each membership has a `role` field:

- `owner` — full control, including editing and deleting
- Other roles — read/write access but cannot delete or edit business metadata

---

### GET /business

Returns all businesses the authenticated user belongs to, including their role in each.

**Authentication:** Cookie

**Response `200 OK`**

```json
{
  "businesses": [
    {
      "id": "string",
      "name": "string",
      "description": "string | null",
      "createdAt": "ISO 8601",
      "updatedAt": "ISO 8601",
      "role": "owner | member"
    }
  ]
}
```

**Error responses**

| Status | Body                                        | Reason            |
| ------ | ------------------------------------------- | ----------------- |
| `401`  | `{ "error": "Unauthorized" }`               | Missing cookie    |
| `401`  | `{ "error": "Invalid token" }`              | Bad/expired token |
| `500`  | `{ "error": "Failed to fetch businesses" }` | Server error      |

---

### POST /business

Creates a new business and sets the creating user as `owner`.

**Authentication:** Cookie

**Request body**

```json
{
  "name": "string", // required
  "description": "string" // optional
}
```

**Response `201 Created`**

```json
{
  "business": {
    "id": "string",
    "name": "string",
    "description": "string | null",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```

**Error responses**

| Status | Body                                       | Reason            |
| ------ | ------------------------------------------ | ----------------- |
| `400`  | `{ "error": "Business name is required" }` | Missing `name`    |
| `401`  | `{ "error": "Unauthorized" }`              | Missing cookie    |
| `401`  | `{ "error": "Invalid token" }`             | Bad/expired token |
| `500`  | `{ "error": "Failed to create business" }` | Server error      |

---

### PATCH /business/:id

Updates the `name` and/or `description` of a business. **Owner only.**

**Authentication:** Cookie

**URL parameter:** `id` — business ID

**Request body**

```json
{
  "name": "string", // optional
  "description": "string" // optional
}
```

**Response `200 OK`**

```json
{
  "business": {
    "id": "string",
    "name": "string",
    "description": "string | null",
    "createdAt": "ISO 8601",
    "updatedAt": "ISO 8601"
  }
}
```

**Error responses**

| Status | Body                                                | Reason                       |
| ------ | --------------------------------------------------- | ---------------------------- |
| `401`  | `{ "error": "Unauthorized" }`                       | Missing cookie               |
| `401`  | `{ "error": "Invalid token" }`                      | Bad/expired token            |
| `403`  | `{ "error": "Only the owner can edit a business" }` | Caller is not owner          |
| `404`  | `{ "error": "Business not found" }`                 | No membership found for user |
| `500`  | `{ "error": "Failed to update business" }`          | Server error                 |

---

### DELETE /business/:id

Permanently deletes a business and all associated data (incomes, expenses, memberships). **Owner only.**

**Authentication:** Cookie

**URL parameter:** `id` — business ID

**Response `200 OK`**

```json
{ "success": true }
```

**Error responses**

| Status | Body                                                  | Reason                       |
| ------ | ----------------------------------------------------- | ---------------------------- |
| `401`  | `{ "error": "Unauthorized" }`                         | Missing cookie               |
| `401`  | `{ "error": "Invalid token" }`                        | Bad/expired token            |
| `403`  | `{ "error": "Only the owner can delete a business" }` | Caller is not owner          |
| `404`  | `{ "error": "Business not found" }`                   | No membership found for user |
| `500`  | `{ "error": "Failed to delete business" }`            | Server error                 |

---

## Invoices

### GET /invoice/:id

Fetches a single income or expense record by its database ID.

**Authentication:** None _(public — consider adding auth if needed)_

**URL parameter:** `id` — record ID

**Query parameters**

| Parameter | Type                | Required | Description                   |
| --------- | ------------------- | -------- | ----------------------------- |
| `type`    | `income \| expense` | Yes      | The type of record to look up |

**Response `200 OK`**

```json
{
  "success": true,
  "type": "income | expense",
  "invoice": {
    /* full Income or Expense record */
  }
}
```

**Error responses**

| Status | Body                                               | Reason                                   |
| ------ | -------------------------------------------------- | ---------------------------------------- |
| `400`  | `{ "error": "Invalid or missing type parameter" }` | `type` missing or not `income`/`expense` |
| `404`  | `{ "error": "Income not found" }`                  | No record with that ID                   |
| `404`  | `{ "error": "Expense not found" }`                 | No record with that ID                   |
| `500`  | `{ "error": "Failed to fetch invoice" }`           | Server error                             |

---

### GET /invoice/by-number

Searches for income or expense records by their document number within a business.

- For `type=income` — searches by `zahlungsnummer`
- For `type=expense` — searches by `rechnungsnummer`

Returns all matching records (there may be more than one if numbers are reused).

**Authentication:** Cookie

**Query parameters**

| Parameter    | Type                | Required | Description                                              |
| ------------ | ------------------- | -------- | -------------------------------------------------------- |
| `number`     | `string`            | Yes      | The zahlungsnummer (income) or rechnungsnummer (expense) |
| `type`       | `income \| expense` | Yes      | Which record type to search                              |
| `businessId` | `string`            | Yes      | Scope the search to this business                        |

**Response `200 OK`**

```json
{
  "success": true,
  "type": "income | expense",
  "results": [
    {
      /* full Income or Expense record */
    }
  ]
}
```

`results` is an array sorted by `createdAt` descending. It is empty (`[]`) when no record matches.

**Error responses**

| Status | Body                                                | Reason                            |
| ------ | --------------------------------------------------- | --------------------------------- |
| `400`  | `{ "error": "number parameter is required" }`       | Missing `number`                  |
| `400`  | `{ "error": "type must be 'income' or 'expense'" }` | Missing or invalid `type`         |
| `400`  | `{ "error": "businessId parameter is required" }`   | Missing `businessId`              |
| `401`  | `{ "error": "Unauthorized" }`                       | Missing cookie                    |
| `401`  | `{ "error": "Invalid token" }`                      | Bad/expired token                 |
| `403`  | `{ "error": "Access denied to this business" }`     | User not a member of the business |
| `500`  | `{ "error": "Failed to fetch invoice" }`            | Server error                      |

---

## Listing

### GET /list/income

Returns a filtered, date-desc sorted list of income records for a business.

**Authentication:** Cookie

**Query parameters**

| Parameter    | Type     | Required | Description                                 |
| ------------ | -------- | -------- | ------------------------------------------- |
| `businessId` | `string` | Yes      | The business to query                       |
| `startDate`  | `string` | No       | ISO 8601 date — filter `datum >= startDate` |
| `endDate`    | `string` | No       | ISO 8601 date — filter `datum <= endDate`   |
| `minAmount`  | `number` | No       | Filter `total >= minAmount`                 |
| `maxAmount`  | `number` | No       | Filter `total <= maxAmount`                 |

**Response `200 OK`**

```json
{
  "success": true,
  "incomes": [
    {
      "id": "string",
      "businessId": "string",
      "fileName": "string",
      "zahlungsnummer": "string | null",
      "datum": "ISO 8601 | null",
      "artikel": "string | null",
      "kaeufer": "string | null",
      "preis": "number | null",
      "versandkosten": "number | null",
      "gebuehren": "number | null",
      "bezahlt": "boolean",
      "total": "number | null",
      "zahlungsmethode": "string | null",
      "createdAt": "ISO 8601"
    }
  ]
}
```

**Error responses**

| Status | Body                                            | Reason               |
| ------ | ----------------------------------------------- | -------------------- |
| `400`  | `{ "error": "Business ID is required" }`        | Missing `businessId` |
| `401`  | `{ "error": "Unauthorized" }`                   | Missing cookie       |
| `401`  | `{ "error": "Invalid token" }`                  | Bad/expired token    |
| `403`  | `{ "error": "Access denied to this business" }` | User not a member    |
| `500`  | `{ "error": "Failed to fetch incomes" }`        | Server error         |

---

### GET /list/expense

Returns a filtered, date-desc sorted list of expense records for a business.

**Authentication:** Cookie

**Query parameters**

| Parameter    | Type     | Required | Description                                 |
| ------------ | -------- | -------- | ------------------------------------------- |
| `businessId` | `string` | Yes      | The business to query                       |
| `startDate`  | `string` | No       | ISO 8601 date — filter `datum >= startDate` |
| `endDate`    | `string` | No       | ISO 8601 date — filter `datum <= endDate`   |
| `minAmount`  | `number` | No       | Filter `betrag >= minAmount`                |
| `maxAmount`  | `number` | No       | Filter `betrag <= maxAmount`                |

**Response `200 OK`**

```json
{
  "success": true,
  "expenses": [
    {
      "id": "string",
      "businessId": "string",
      "fileName": "string",
      "rechnungsnummer": "string | null",
      "datum": "ISO 8601 | null",
      "artikel_zweck": "string | null",
      "lieferant": "string | null",
      "betrag": "number | null",
      "zahlungsmethode": "string | null",
      "createdAt": "ISO 8601"
    }
  ]
}
```

**Error responses**

| Status | Body                                            | Reason               |
| ------ | ----------------------------------------------- | -------------------- |
| `400`  | `{ "error": "Business ID is required" }`        | Missing `businessId` |
| `401`  | `{ "error": "Unauthorized" }`                   | Missing cookie       |
| `401`  | `{ "error": "Invalid token" }`                  | Bad/expired token    |
| `403`  | `{ "error": "Access denied to this business" }` | User not a member    |
| `500`  | `{ "error": "Failed to fetch expenses" }`       | Server error         |

---

## Saving Records

These endpoints persist a previously uploaded document as a structured accounting record. They also **rename the file in MinIO** from its temporary upload name to a canonical name (`Einnahme_<id>.<ext>` for income, `Ausgabe_<id>.<ext>` for expense).

> **Typical workflow:**
>
> 1. Upload file → `POST /upload-income` or `POST /upload-expense`
> 2. Review AI-extracted data in the UI
> 3. Save confirmed record → `POST /save-income` or `POST /save-expense`

---

### POST /save-income

Saves an income record and renames its associated file in MinIO to `Einnahme_<id>.<ext>`.

**Authentication:** Cookie

**Request body**

```json
{
  "businessId": "string", // required
  "fileName": "string", // temporary filename from upload step
  "zahlungsnummer": "string | null", // payment/order number
  "datum": "ISO 8601 | null", // date of transaction
  "artikel": "string | null", // item description
  "kaeufer": "string | null", // buyer name
  "preis": "number | null", // net price
  "versandkosten": "number | null", // shipping costs
  "gebuehren": "number | null", // fees
  "bezahlt": "boolean", // payment received
  "total": "number | null", // total amount
  "zahlungsmethode": "string | null" // payment method
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "income": {
    /* full Income record with renamed fileName */
  }
}
```

**Error responses**

| Status | Body                                            | Reason               |
| ------ | ----------------------------------------------- | -------------------- |
| `400`  | `{ "error": "Business ID is required" }`        | Missing `businessId` |
| `401`  | `{ "error": "Unauthorized" }`                   | Missing cookie       |
| `401`  | `{ "error": "Invalid token" }`                  | Bad/expired token    |
| `403`  | `{ "error": "Access denied to this business" }` | User not a member    |
| `500`  | `{ "error": "Failed to save income" }`          | Server error         |

---

### POST /save-expense

Saves an expense record and renames its associated file in MinIO to `Ausgabe_<id>.<ext>`.

**Authentication:** Cookie

**Request body**

```json
{
  "businessId": "string", // required
  "fileName": "string", // temporary filename from upload step
  "rechnungsnummer": "string | null", // invoice number
  "datum": "ISO 8601 | null", // date of transaction
  "artikel_zweck": "string | null", // item or purpose
  "lieferant": "string | null", // supplier name
  "betrag": "number | null", // amount
  "zahlungsmethode": "string | null" // payment method
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "expense": {
    /* full Expense record with renamed fileName */
  }
}
```

**Error responses**

| Status | Body                                            | Reason               |
| ------ | ----------------------------------------------- | -------------------- |
| `400`  | `{ "error": "Business ID is required" }`        | Missing `businessId` |
| `401`  | `{ "error": "Unauthorized" }`                   | Missing cookie       |
| `401`  | `{ "error": "Invalid token" }`                  | Bad/expired token    |
| `403`  | `{ "error": "Access denied to this business" }` | User not a member    |
| `500`  | `{ "error": "Failed to save expense" }`         | Server error         |

---

## File Uploads

These endpoints accept `multipart/form-data` with a `file` field.

---

### POST /upload-income

Supports two modes selected by `Content-Type`:

#### Mode A — OCR (multipart/form-data)

Uploads a file to MinIO, runs server-side OCR, and parses income fields with AI. Returns raw extracted data for the user to review before saving via `POST /save-income`. **No authentication required.**

**Authentication:** None

**Request:** `multipart/form-data`

| Field  | Type   | Required | Description            |
| ------ | ------ | -------- | ---------------------- |
| `file` | `File` | Yes      | PDF, PNG, or JPEG file |

**Response `200 OK`**

```json
{
  "success": true,
  "fileName": "income_<timestamp>_<original-name>",
  "extractedText": "string",
  "parsedData": {
    "zahlungsnummer": "string | null",
    "datum": "string | null",
    "artikel": "string | null",
    "kaeufer": "string | null",
    "preis": "number | null",
    "versandkosten": "number | null",
    "gebuehren": "number | null",
    "bezahlt": "boolean | null",
    "total": "number | null",
    "zahlungsmethode": "string | null"
  }
}
```

**Error responses**

| Status | Body                                    | Reason         |
| ------ | --------------------------------------- | -------------- |
| `400`  | `{ "error": "No file provided" }`       | Missing `file` |
| `500`  | `{ "error": "Failed to process file" }` | Server error   |

#### Mode B — Direct save (application/json)

Accepts structured income data directly and saves the record to the database immediately — **no file or OCR needed**. Designed for automated integrations such as an online shop pushing orders in real time.

**Authentication:** Cookie (required)

**Request body**

```json
{
  "businessId": "string", // required
  "fileName": "string", // optional, default ""
  "zahlungsnummer": "string | null",
  "datum": "ISO 8601 | null",
  "artikel": "string | null",
  "kaeufer": "string | null",
  "preis": "number | null",
  "versandkosten": "number | null",
  "gebuehren": "number | null",
  "bezahlt": "boolean",
  "total": "number | null",
  "zahlungsmethode": "string | null"
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "income": {
    /* full Income record */
  }
}
```

**Error responses**

| Status | Body                                            | Reason               |
| ------ | ----------------------------------------------- | -------------------- |
| `400`  | `{ "error": "Business ID is required" }`        | Missing `businessId` |
| `401`  | `{ "error": "Unauthorized" }`                   | Missing cookie       |
| `401`  | `{ "error": "Invalid token" }`                  | Bad/expired token    |
| `403`  | `{ "error": "Access denied to this business" }` | User not a member    |
| `500`  | `{ "error": "Failed to process file" }`         | Server error         |

---

### POST /upload-expense

Supports two modes selected by `Content-Type`:

#### Mode A — OCR (multipart/form-data)

Uploads a file to MinIO, runs server-side OCR, and parses expense fields with AI. Returns raw extracted data for review before saving via `POST /save-expense`. **No authentication required.**

**Authentication:** None

**Request:** `multipart/form-data`

| Field  | Type   | Required | Description            |
| ------ | ------ | -------- | ---------------------- |
| `file` | `File` | Yes      | PDF, PNG, or JPEG file |

**Response `200 OK`**

```json
{
  "success": true,
  "fileName": "expense_<timestamp>_<original-name>",
  "extractedText": "string",
  "parsedData": {
    "rechnungsnummer": "string | null",
    "datum": "string | null",
    "artikel_zweck": "string | null",
    "lieferant": "string | null",
    "betrag": "number | null",
    "zahlungsmethode": "string | null"
  }
}
```

**Error responses**

| Status | Body                                    | Reason         |
| ------ | --------------------------------------- | -------------- |
| `400`  | `{ "error": "No file provided" }`       | Missing `file` |
| `500`  | `{ "error": "Failed to process file" }` | Server error   |

#### Mode B — Direct save (application/json)

Accepts structured expense data directly and saves the record to the database immediately — no file or OCR needed. Designed for automated integrations.

**Authentication:** Cookie (required)

**Request body**

```json
{
  "businessId": "string", // required
  "fileName": "string", // optional, default ""
  "rechnungsnummer": "string | null",
  "datum": "ISO 8601 | null",
  "artikel_zweck": "string | null",
  "lieferant": "string | null",
  "betrag": "number | null",
  "zahlungsmethode": "string | null"
}
```

**Response `200 OK`**

```json
{
  "success": true,
  "expense": {
    /* full Expense record */
  }
}
```

**Error responses**

| Status | Body                                            | Reason               |
| ------ | ----------------------------------------------- | -------------------- |
| `400`  | `{ "error": "Business ID is required" }`        | Missing `businessId` |
| `401`  | `{ "error": "Unauthorized" }`                   | Missing cookie       |
| `401`  | `{ "error": "Invalid token" }`                  | Bad/expired token    |
| `403`  | `{ "error": "Access denied to this business" }` | User not a member    |
| `500`  | `{ "error": "Failed to process file" }`         | Server error         |

---

### POST /upload-file

Accepts a file and returns it as Base64-encoded data to the client for **client-side OCR processing**. The file is **not** uploaded to MinIO by this endpoint.

**Authentication:** None

**Request:** `multipart/form-data`

| Field  | Type   | Required | Description |
| ------ | ------ | -------- | ----------- |
| `file` | `File` | Yes      | Any file    |

**Response `200 OK`**

```json
{
  "success": true,
  "fileName": "file_<timestamp>_<original-name>",
  "fileType": "string",
  "fileData": "<base64-encoded file content>"
}
```

**Error responses**

| Status | Body                                    | Reason         |
| ------ | --------------------------------------- | -------------- |
| `400`  | `{ "error": "No file provided" }`       | Missing `file` |
| `500`  | `{ "error": "Failed to process file" }` | Server error   |

---

### POST /upload-to-minio

Uploads a file to MinIO with an **explicit filename**. Used to persist a file under a specific name after client-side processing.

**Authentication:** None

**Request:** `multipart/form-data`

| Field      | Type     | Required | Description                     |
| ---------- | -------- | -------- | ------------------------------- |
| `file`     | `File`   | Yes      | The file to upload              |
| `fileName` | `string` | Yes      | Target filename to use in MinIO |

**Response `200 OK`**

```json
{ "success": true }
```

**Error responses**

| Status | Body                                      | Reason                     |
| ------ | ----------------------------------------- | -------------------------- |
| `400`  | `{ "error": "Missing file or fileName" }` | One or both fields missing |
| `500`  | `{ "error": "Upload failed" }`            | MinIO error                |

---

## File Downloads

### GET /download/:filename

Downloads a file from MinIO by its stored filename. The response content type is inferred from the file extension.

**Authentication:** None _(consider adding auth if files are sensitive)_

**URL parameter:** `filename` — the exact filename stored in MinIO (e.g. `Einnahme_abc123.pdf`)

**Supported content types**

| Extension        | Content-Type               |
| ---------------- | -------------------------- |
| `.pdf`           | `application/pdf`          |
| `.png`           | `image/png`                |
| `.jpg` / `.jpeg` | `image/jpeg`               |
| other            | `application/octet-stream` |

**Response `200 OK`**

Binary file content with headers:

```
Content-Type: <determined by extension>
Content-Disposition: inline; filename="<filename>"
```

**Error responses**

| Status | Body                                     | Reason         |
| ------ | ---------------------------------------- | -------------- |
| `400`  | `{ "error": "Filename is required" }`    | Empty filename |
| `500`  | `{ "error": "Failed to download file" }` | MinIO error    |
