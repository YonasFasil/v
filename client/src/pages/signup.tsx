import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowRight } from "lucide-react";

export default function SignUpPage() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    companyName: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/signup", formData);
      toast({
        title: "Account Created!",
        description: "You can now log in with your new account.",
      });
      // Redirect to login page after a short delay
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (error: any) {
      toast({
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Start managing your venue with VenuinePro.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              name="companyName"
              type="text"
              required
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              onChange={handleChange}
              className="mt-1"
            />
          </div>
          <Button type="submit" size="lg" className="w-full text-lg" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Sign Up"}
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-blue-600 hover:underline font-medium">
              Log in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
