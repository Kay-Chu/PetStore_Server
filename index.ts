import Koa from "koa";
import Router, { RouterContext }  from "koa-router";
import logger from "koa-logger";
import json from "koa-json";
import passport from 'koa-passport';
import bodyParser from "koa-bodyparser";
import cors from '@koa/cors' ;
import { router as articles } from "./routes/articles";
import { router as special } from './routes/special';
import { router as uploads } from './routes/uploads';
import { router as users } from "./routes/users";
import serve from 'koa-static';

const app: Koa = new Koa();
const router: Router = new Router();

/*const welcomeAPI = async (ctx: RouterContext, next:any) => {
  ctx.body = {message: "Welcome to the blog API!"};
  await next();
}

router.get('/api/v1', welcomeAPI);
*/
// For Document:
app.use(serve('./docs'));


// app.use(cors());

const corsOptions = {
  origin: 'http://localhost:5173'
};
app.use(cors(corsOptions));


app.use(logger());
app.use(json());
app.use(bodyParser());
app.use(router.routes());
app.use(passport.initialize());
app.use(articles.middleware());
app.use(special.middleware());
app.use(uploads.middleware());
app.use(users.middleware());

app.use(async (ctx: RouterContext, next: any) => {
  try {
    await next();
    console.log(ctx.status)
    if(ctx.status === 404){
      ctx.body = {err: "No such endpoint existed"};
    }
  } catch(err: any) {
    ctx.status = err.status || 500; // Set status code based on error or default to 500
    ctx.body = {error: err.message}; // Provide the error message
    ctx.app.emit('error', err, ctx); // Optional: Emit the error internally for logging
  }
  
});
let port = process.env.PORT || 10888;
app.listen(port, () => {
console.log( `Koa Started at ${port}` );
})