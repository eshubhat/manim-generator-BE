import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { User } from "../db/User";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ oauthId: profile.id, provider: "google" });

      if (!user) {
        user = await User.create({
          first_name: profile.name?.givenName || "First",
          last_name: profile.name?.familyName || "Last",
          email: profile.emails?.[0]?.value,
          provider: "google",
          oauthId: profile.id,
        });
      }

      return done(null, user);
    }
  )
);

// Optional GitHub strategy
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      callbackURL: "/auth/github/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ oauthId: profile.id, provider: "github" });

      if (!user) {
        user = await User.create({
          first_name: profile.displayName || "GitHubUser",
          last_name: "",
          email: profile.emails?.[0]?.value || `user-${profile.id}@github.com`,
          provider: "github",
          oauthId: profile.id,
        });
      }

      return done(null, user);
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  const user = await User.findById(id);
  done(null, user);
});
