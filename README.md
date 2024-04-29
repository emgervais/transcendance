
  <h1>ft_transcendence</h1>

  <h2>Description</h2>
  <p><strong>ft_transcendence</strong> is a web application aimed at providing users with the ability to play the classic game Pong against each other in real-time. Additionally, users can organize and participate in tournaments, manage their profiles, and engage in live chat with other players.</p>

  <hr>

  <h2>Technical Constraints</h2>
  <ul>
    <li><strong>Backend:</strong> The project can be developed with or without a backend. If a backend is included, it must be coded in Django</li>
    <li><strong>Frontend:</strong> Native JavaScript should be used for frontend development, without any frameworks or extensions. Bootstrap toolkit can be utilized for frontend development.</li>
    <li><strong>Website Type:</strong> The website should be a single-page application, allowing users to navigate using browser navigation buttons.</li>
    <li><strong>Compatibility:</strong> The website must be compatible with the latest version of Google Chrome, and users should not encounter unhandled errors or warnings.</li>
    <li><strong>Docker:</strong> The entire project should be compiled and run using Docker containers, ensuring ease of deployment.</li>
  </ul>

  <hr>

  <h2>Game</h2>
  <p>The primary functionality of the website is centered around playing Pong. Users can:</p>
  <ul>
    <li>Play real-time Pong against each other, using the same keyboard.</li>
    <li>Organize and participate in tournaments with other players.</li>
    <li>Register with unique aliases for tournaments.</li>
    <li>Utilize a matchmaking system to organize games and tournaments.</li>
    <li>Ensure fair play with identical paddle speeds for all players.</li>
  </ul>

  <hr>

  <h2>Security</h2>
  <p>Security measures implemented in the project include:</p>
  <ul>
    <li>Encryption of passwords stored in the database.</li>
    <li>Protection against SQL/XSS injections.</li>
    <li>Implementation of HTTPS connection for secure communication.</li>
    <li>Form validation for user input.</li>
    <li>Storage of sensitive information in a local .env file, excluded from version control.</li>
  </ul>

  <hr>

  <h2>Features</h2>

  <h3>Backend Framework</h3>
  <p>Django framework must be used for backend development.</p>

  <h3>Frontend Toolkit</h3>
  <p>Bootstrap toolkit should be utilized for frontend development.</p>

  <h3>Database</h3>
  <p>PostgreSQL is the designated database for the project.</p>

  <h3>User Management and Authentication</h3>
  <p>Users can securely register, authenticate, and manage their profiles. User statistics, game history, and friend management are included.</p>

  <h3>Remote Authentication</h3>
  <p>OAuth 2.0 authentication with 42 is implemented for secure remote authentication.</p>

  <h3>Remote Players</h3>
  <p>It is possible to have 2 remote players. Each player is on a different computer, accessing the same website and playing the same Pong game. Consider network issues, such as unexpected disconnection or latency. You must provide the best possible user experience.</p>

  <h3>Live Chat</h3>
  <p>A chat system is implemented for users, allowing direct messaging, blocking, and game invitations. Tournament notifications and access to user profiles are integrated into the chat interface.</p>

