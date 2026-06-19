import "./globals.css";

export const metadata = {
  title: "TaskGate | Secure Enterprise Task Management & MFA",
  description: "Secure enterprise task management with role-based access control (RBAC), multi-factor authentication (MFA), and audit log tracking. Deploy secure workflows instantly.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
