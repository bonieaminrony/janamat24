import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import logo from "@/assets/logo.jpg";
const loginSchema = z.object({
  email: z.string().email("সঠিক ইমেইল ঠিকানা দিন"),
  password: z.string().min(6, "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে")
});
const AuthPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const navigate = useNavigate();
  const {
    toast
  } = useToast();

  // Check if already logged in
  useEffect(() => {
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        navigate("/admin");
      }
    });
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session?.user) {
        navigate("/admin");
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate input
    const result = loginSchema.safeParse({
      email,
      password
    });
    if (!result.success) {
      const fieldErrors: {
        email?: string;
        password?: string;
      } = {};
      result.error.errors.forEach(err => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        if (error.message.includes("Invalid login")) {
          toast({
            title: "লগইন ব্যর্থ",
            description: "ইমেইল বা পাসওয়ার্ড সঠিক নয়",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }

      // Track login activity
      if (data.user) {
        // Update last login time in profiles
        await supabase.from("profiles").update({
          last_login_at: new Date().toISOString()
        }).eq("user_id", data.user.id);

        // Insert login activity record
        await supabase.from("reporter_activity").insert({
          user_id: data.user.id,
          activity_type: "login",
          metadata: {
            timestamp: new Date().toISOString(),
            user_agent: navigator.userAgent
          }
        });
      }
      toast({
        title: "সফল!",
        description: "সফলভাবে লগইন হয়েছে"
      });
      navigate("/admin");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "একটি সমস্যা হয়েছে";
      toast({
        title: "ত্রুটি",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <img alt="জনমত ২৪" className="h-16 w-auto rounded-md shadow-md cursor-pointer" src="/favicon.png" />
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-headline">জনমত ২৪ অ্যাডমিন</h1>
          <p className="text-subtext mt-2">
            অ্যাডমিন প্যানেলে প্রবেশ করুন
          </p>
        </div>

        {/* Form */}
        <div className="bg-card border border-divider rounded-lg p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">ইমেইল</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@email.com" required className="h-11" />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">পাসওয়ার্ড</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="h-11" />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" className="w-full h-11 font-medium" disabled={loading}>
              {loading ? "অপেক্ষা করুন..." : "লগইন"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-subtext">
            <p>শুধুমাত্র অনুমোদিত ব্যবহারকারীদের জন্য</p>
          </div>
        </div>
      </div>
    </div>;
};
export default AuthPage;