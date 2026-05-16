import { loginAction } from "@/actions/auth";
import { AuthForm } from "@/components/auth-form";
import { LoginDemoAccounts } from "@/components/login-demo-accounts";

const LOGIN_FORM_ID = "login-form";

export default function LoginPage() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <AuthForm
        id={LOGIN_FORM_ID}
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
      <LoginDemoAccounts formId={LOGIN_FORM_ID} />
    </div>
  );
}
