import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { config } from '../../config';
import { User } from '../../models';
import { encrypt } from '../../utils/encryption';
import { logger } from '../../utils/logger';

passport.use(
  new GitHubStrategy(
    {
      clientID: config.github.clientId,
      clientSecret: config.github.clientSecret,
      callbackURL: config.github.callbackUrl,
      scope: ['user:email', 'repo', 'read:org'],
    },
    async (accessToken: string, _refreshToken: string, profile: any, done: Function) => {
      try {
        const encryptedToken = encrypt(accessToken);
        const email =
          (profile.emails && profile.emails[0]?.value) || '';

        const user = await User.findOneAndUpdate(
          { githubId: profile.id },
          {
            $set: {
              login: profile.username || '',
              name: profile.displayName || profile.username || '',
              email,
              avatarUrl: profile.photos?.[0]?.value || '',
              encryptedAccessToken: encryptedToken,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return done(null, user);
      } catch (err) {
        logger.error('GitHub OAuth error:', err);
        return done(err);
      }
    }
  )
);

passport.serializeUser((user: any, done) => {
  done(null, user._id.toString());
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
