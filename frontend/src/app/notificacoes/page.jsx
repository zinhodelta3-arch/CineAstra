import NotificationCenter from "@/components/notifications/notification-center";

export const metadata = {
  title: "Notificações | CineAstra",
  description: "Acompanhe suas compras, sessões e respostas do CineAstra.",
};

// O header e o footer existentes continuam sob responsabilidade do layout.
export default function NotificationsPage() {
  return <NotificationCenter />;
}
