import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api/admin";
import { tokenStorage } from "../api/client";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const { data } = await adminApi.login({
        email,
        password,
        userType: "Super",
        mobileNumber: "639972833560"
      });

      const token = data.data?.session?.accessToken;

      if (!token) {
        throw new Error(
            "Login response did not contain an access token."
        );
      }

      tokenStorage.setAccessToken(token);

      navigate("/");
    } catch (err: any) {
      setError(
          err.response?.data?.message ??
          err.message ??
          "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
      <div className="login-page">
        <form className="login-card" onSubmit={submit}>
          <div className="login-logo">
            <span>H</span>
          </div>

          <h1>Welcome back</h1>

          <p>Sign in to Hatid Backoffice</p>

          {error && (
              <div className="error-box">
                {error}
              </div>
          )}

          <label>
            Email

            <input
                value={email}
                onChange={(e) =>
                    setEmail(e.target.value)
                }
                type="email"
                placeholder="@"
                required
            />
          </label>

          <label>
            Password

            <input
                value={password}
                onChange={(e) =>
                    setPassword(e.target.value)
                }
                type="password"
                required
            />
          </label>

          <button
              className="primary-btn"
              disabled={loading}
          >
            {loading
                ? "Signing in..."
                : "Sign in"}
          </button>
        </form>
      </div>
  );
}