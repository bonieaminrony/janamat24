import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function RealtimeTracker() {
  useEffect(() => {
    // Generate a simple anonymous session ID if not logged in
    const setupPresence = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const presenceKey = user?.id || `anon-${Math.random().toString(36).substring(2, 9)}`;

      const channel = supabase.channel('online-users', {
        config: {
          presence: {
            key: presenceKey,
          },
        },
      });

      channel
        .on('presence', { event: 'sync' }, () => {
          // We don't need to do anything here globally, 
          // the AdminDashboard will listen to its own instance of the channel
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              online_at: new Date().toISOString(),
              user_id: user?.id || null,
              is_admin: !!user,
            });
          }
        });

      return () => {
        channel.unsubscribe();
      };
    };

    setupPresence();
  }, []);

  return null; // This component doesn't render anything
}
