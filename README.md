# Linguastand

A powerful language processing application built with React that leverages Chrome's AI APIs for translation, summarization, and speech capabilities.

## Live Demo

[https://ai-text-processor-hng-orpin.vercel.app/](https://ai-text-processor-hng-orpin.vercel.app/)

## Features

- **Multi-language Translation**
  - Supports English, French, Portuguese, Russian, Spanish, and Turkish
  - Automatic language detection
  - Real-time translation processing

- **Text Processing**
  - Smart text summarization
  - Key points extraction
  - 5000 character support per message

- **Audio Capabilities**
  - Text-to-speech conversion
  - Speech-to-text input
  - Language-specific pronunciation

- **User Experience**
  - Dark/Light theme toggle
  - Real-time character counting
  - Responsive chat interface
  - Message timestamping

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 14.0.0 or higher)
- npm or yarn package manager
- Chrome browser with AI features enabled

## Installation

1. Clone the repository
```bash
git clone https://github.com/eniolatalabi/ai-text-processor-hng.git
```

2. Navigate to the project directory
```bash
cd ai-text-processor-hng
```

3. Install dependencies
```bash
npm install
# or
yarn install
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open http://localhost:3000 in your Chrome browser

## Project Structure

```
ai-text-processor-hng/
├── src/
│   ├── components/
│   │   ├── ActionButtons/
│   │   │   ├── ActionButtons.jsx
│   │   │   └── ActionButtons.css
│   │   ├── DarkModeToggle/
│   │   │   ├── DarkModeToggle.jsx
│   │   │   └── DarkModeToggle.css
│   │   └── InputArea/
│   │       ├── InputArea.jsx
│   │       └── InputArea.css
│   ├── App.jsx
│   ├── App.css
│   └── main.jsx
├── public/
├── index.html
├── package.json
└── README.md
```

## Component Structure

- **App.jsx**: Main application component
  - Manages state for messages, language detection, and UI controls
  - Handles API integrations and error management
  - Implements speech recognition and synthesis

- **Components**:
  - **ActionButtons**: Handles translation and summarization actions
  - **DarkModeToggle**: Manages theme switching
  - **InputArea**: Text input and character counting functionality

## Key Dependencies

- React
- Chrome AI APIs
- Web Speech API

## Important Notes

- This application requires Chrome's AI features to be enabled
- Speech recognition functionality is browser-dependent
- Maximum input length is 5000 characters per message

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Author

- Eniola Talabi - [GitHub Profile](https://github.com/eniolatalabi)

## Acknowledgments

- Chrome AI API Team
- Vercel for hosting

---
If you found this project helpful, please give it a star!