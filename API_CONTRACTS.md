# API CONTRACTS
## Auth Flow
- Method: `POST /api/auth`
- Input: `{ phone: string }`
- Output: `{ success: boolean, message: string }`

## Response Standard
All responses should follow:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```
