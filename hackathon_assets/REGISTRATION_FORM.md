# AWS 10,000 AIdeas Registration Form Answers (Ultra-Safe Version)

> ⚠️ **Note**: This version removes ALMOST ALL punctuation (parens, colons) and changes "burn after reading" to safer terms to avoid any validation triggers.

---

### Team name
Snowflake Lab

### In one or two sentences, what's your big idea?
Snowflake Whisper is a poetic and privacy focused messaging tool that transforms texts into unique and ephemeral fractal snowflakes. It combines military grade encryption with generative art to reintroduce digital scarcity to communication, making every message beautiful and unique and fleeting as they self delete in 60 seconds.

### Tell us about your vision - what exactly will you build?
We are building a Gallery of Impermanence where privacy meets art.

Core Features
1. Text to Fractal Engine. A custom algorithm uses the SHA 256 hash of the message to seed the geometry of a unique snowflake. Even a single character change creates a completely different crystal.
2. Client Side Zero Knowledge Encryption. AES 256 GCM encryption performed entirely in the browser using Web Crypto API. The server never touches the keys or plaintext.
3. AI Enhanced Aesthetics. Planned usage of Amazon Bedrock to analyze the emotional sentiment of the text and automatically adjust the snowflake color palette.
4. Ephemeral Protocol. A strict timer enforces the data deletion philosophy, challenging the modern habit of permanent data hoarding.

### How will your solution make a difference?
Problem. Modern digital communication is cheap and permanent and surveillance heavy. We hoard data but lose meaning.

Solution. Snowflake Whisper imposes constraints like time limits and adds beauty via fractal art to force users to cherish the moment of connection.

Impact
1. Emotional. It turns a simple text into a digital gift enhancing the emotional weight of communication.
2. Privacy. It normalizes high security encryption for everyday users by wrapping it in a beautiful non intimidating interface.
3. Digital Wellbeing. It promotes a digital detox mindset letting data flow like water rather than piling up.

### What's your game plan for building this?
Phase 1 The Core.
1. Built the POC using React 19 and TypeScript and Vite.
2. Implemented the snowflake fractal logic and Web Crypto API encryption modules.
3. Created the Melting countdown UI.

Phase 2 AWS Integration.
1. Hosting. Deploy frontend to AWS Amplify for global availability and CI CD.
2. AI Intelligence. Integrate Amazon Bedrock Claude 3.5 Sonnet. When a user types a message Bedrock will analyze the sentiment and generate a hexcode palette that fits the mood which feeds into the fractal generator.
3. Backend Signaling. Use AWS Lambda and Amazon DynamoDB to store only the encrypted blobs and ephemeral metadata ensuring true zero knowledge architecture.

Phase 3 Scale.
1. Optimize fractal rendering with WebAssembly for smoother animations on mobile.
2. Launch a Public Gallery of melted snowflakes to visualize global emotional trends without revealing private content.
