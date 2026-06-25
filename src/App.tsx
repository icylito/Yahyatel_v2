import { Routes, Route } from "react-router";
import { Toaster } from 'sonner';
import ProjectLayout from "./components/ProjectLayout";
import Home from "./pages/Home";
import AIAnalyzer from "./pages/AIAnalyzer";
import Services from "./pages/Services";
import AdminDashboard from "./pages/AdminDashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Cart from "./pages/Cart";
import Terms from "./pages/Terms";
import ThankYou from "./pages/ThankYou";
import Profile from "./pages/Profile";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <ProjectLayout>
      <Toaster richColors position="top-center" expand />
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/ai-analyzer" element={<AIAnalyzer />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </ProjectLayout>
  );
}

export default App;
