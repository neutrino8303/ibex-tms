import { signupAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <AuthForm
      title="Create account"
      description="New accounts are assigned the Pilot role by default."
      submitLabel="Create account"
      alternateHref="/login"
      alternateLabel="Already have an account? Sign in"
      action={signupAction}
      fields={[
        {
          name: "firstName",
          label: "First name",
          autoComplete: "given-name",
        },
        {
          name: "lastName",
          label: "Last name",
          autoComplete: "family-name",
        },
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
          autoComplete: "new-password",
        },
      ]}
    />
  );
}
