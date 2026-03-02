# SmartVoteAI 🗳️

Secure AI-Powered Digital Voting Platform.

## Features
- **AI Face Recognition**: Biometric identity verification using 128D embeddings.
- **Secure Encryption**: All biometric data is encrypted before storage.
- **Audit Logging**: Comprehensive tracking of all system events.
- **Tamper-Proof Voting**: SHA256 hashing for vote integrity.
- **Admin Dashboard**: Full control over elections and candidates.
- **Real-time Results**: Live data visualization with charts.

## Setup Instructions

### Local Development
1. Install dependencies: `npm install`
2. Start the dev server: `npm run dev`
3. Access the app at `http://localhost:3000`

### Admin Access
- **Email**: `admin@smartvote.ai`
- **Password**: `admin123`

## Security Architecture
- **Biometrics**: We use `face-api.js` for client-side extraction. Only the mathematical descriptor (128 numbers) is sent to the server.
- **Encryption**: Descriptors are encrypted with AES-256.
- **Hashing**: Votes are anonymized and hashed to prevent tracking while ensuring integrity.
- **Double Voting**: A unique hash of `voter_id + election_id` ensures one vote per person per election.

## Deployment (Render)
1. Connect your GitHub repository to Render.
2. Create a new **Web Service**.
3. Set **Build Command**: `npm run build`
4. Set **Start Command**: `node server.ts`
5. Add the environment variables from `.env.example`.
# Smart-Vote-AI
# SmartVoteAI
