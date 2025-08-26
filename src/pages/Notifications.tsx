
import { NotificationsList } from '@/components/notifications/NotificationsList';

const Notifications = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-zinc-400">Stay updated with your latest activity</p>
        </div>
        
        <NotificationsList />
      </div>
    </div>
  );
};

export default Notifications;
