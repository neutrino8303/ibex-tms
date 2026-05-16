import { loginAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <AuthForm
      title="Sign in"
      description="Use your airline training account credentials."
      submitLabel="Sign in"
      alternateHref="/signup"
      alternateLabel="Create an account"
      action={loginAction}
      fields={[
        {
          name: "email",
          label: "Email",
          type: "email",
          autoComplete: "email",
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          autoComplete: "current-password",
        },
      ]}
    />
  );
}
