import { createBrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { routes } from "./routes.js";
import Dashboard from "./pages/Dashboard.jsx";
import Chat from "./pages/Chat.jsx";
import Summaries from "./pages/Summaries.jsx";
import Quizzes from "./pages/Quizzes.jsx";

export const router = createBrowserRouter(
  [
    {
      path: routes.dashboard,
      element: <App />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: routes.chat, element: <Chat /> },
        { path: routes.summaries, element: <Summaries /> },
        { path: routes.quizzes, element: <Quizzes /> }
      ]
    }
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);
