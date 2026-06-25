import React from "react";
import Navigatorbar from "./Navigatorbar";
import Footer from "./Footer";
import FloatingChatbot from "./FloatingChatbot";
import { useLocation } from "react-router";

const ProjectLayout = ({ children }: { children: React.ReactNode }) => {
    const { pathname } = useLocation();

    return (
        <div className="flex min-h-screen flex-col">
            <Navigatorbar />
            <main className="flex-1">
                <div key={pathname}>
                    {children}
                </div>
            </main>
            <FloatingChatbot />
            <Footer />
        </div>
    );
};

export default ProjectLayout;
