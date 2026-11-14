import type { Metadata } from "next";
import { SiteNav } from "@/app/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Campus Archive | Academic Question Papers",
  description: "A searchable academic question paper archive for your college.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const college = process.env.NEXT_PUBLIC_COLLEGE_NAME || "Your College";

  return (
    <html lang="en">
      <body>
        <SiteNav college={college} />
        {children}
        <footer className="site-footer">
          <div className="container footer-inner">
            <span>© {new Date().getFullYear()} Campus Archive · Built for students</span>
            <span>Academic resources, organized.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
