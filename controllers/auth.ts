import passport from "koa-passport";
import { BasicStrategy } from "passport-http";
import { RouterContext } from "koa-router";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import * as users from '../models/users';


const verifyPassword = (user: any, password: string) => {
  console.log('user return pwd: '+user.password);
  console.log('input password '+ password)
  return user.password === password;
}

passport.use(new BasicStrategy(async (username, password, done) => {

  let result: any[] = [];
  try {
    result = await users.findByUsername(username);
    console.log('user found');
  } catch (error) {
    console.error(`Error during authentication for user ${username}: ${error}`);
    done(null, false);
  }
  if(result.length) {
    const user = result[0];
    console.log('username: '+ user.username);
    if(verifyPassword(user, password)) {
      console.log('done')
      done(null, {user: user});
    } else {
      console.log(`Password incorrect for ${username}`);
      done(null, false);
    }
  } else {
    console.log(`No user found with username ${username}`);
    done(null, false);
  }
}));

export const basicAuth = async (ctx: RouterContext, next: any) => {
  await passport.authenticate("basic", { session: false })(ctx, next);
  if(ctx.status == 401)
  {
    ctx.body = {
      message: 'you are not authorized'
    };
   
   }

    // Set up the Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: "729034240613-tcafn21qn8h2tm47l1uer6lo84hui2l7.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  if (!profile.emails || profile.emails.length === 0 || !profile.emails[0].value) {
    return done(null, false, { message: 'No email provided by Google.' });
  }
  const email = profile.emails[0].value;
  const userData = {
    googleId: profile.id,
    email: email
  };

  try {
    let user = await users.findOrCreate(userData);
    done(null, user);
  } catch (error) {
    done(error);
  }
}));

  }


