import { SignupForm } from '@/components/auth/signup-form';

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="mx-auto w-full max-w-md p-8">
        <h1 className="mb-6 text-center text-3xl font-bold">Create Your Account</h1>
        <SignupForm />
      </div>
    </div>
  );
}
