# Nexzen React App

## Overview
Nexzen React App is a professional property management application built with React. It provides a user-friendly interface for managing properties, including features such as service listings, coverage area checks, and contact forms.

## Project Structure
The project is organized as follows:

```
nexzen-react-app
├── public
│   └── index.html          # Main HTML template for the React application
├── src
│   ├── main.jsx            # Entry point of the React application
│   ├── App.jsx             # Main App component
│   ├── components          # Contains all React components
│   │   ├── NavBar.jsx      # Navigation bar component
│   │   ├── Hero.jsx        # Hero section component
│   │   ├── Services.jsx    # Services listing component
│   │   ├── Coverage.jsx    # Coverage area component
│   │   ├── Contact.jsx      # Contact form component
│   │   ├── LoginModal.jsx  # Login and signup modal component
│   │   └── Footer.jsx      # Footer component
│   ├── hooks
│   │   └── useDataSdk.js   # Custom hook for data interactions
│   ├── styles
│   │   └── globals.css      # Global CSS styles
│   └── utils
│       └── config.js       # Configuration constants and settings
├── package.json            # npm configuration file
├── .gitignore              # Git ignore file
└── README.md               # Project documentation
```

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- npm (Node Package Manager)

### Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd nexzen-react-app
   ```
3. Install the dependencies:
   ```
   npm install
   ```

### Running the Application
To start the development server, run:
```
npm start
```
This will launch the application in your default web browser at `http://localhost:3000`.

### Building for Production
To create a production build of the application, run:
```
npm run build
```
The build artifacts will be stored in the `build` directory.

## Usage
- Navigate through the application using the navigation bar.
- Explore the services offered and check the coverage area using the ZIP code feature.
- Contact us through the contact form for inquiries.
- Access the client portal via the login modal.

## Contributing
Contributions are welcome! Please open an issue or submit a pull request for any enhancements or bug fixes.

## License
This project is licensed under the MIT License. See the LICENSE file for details.