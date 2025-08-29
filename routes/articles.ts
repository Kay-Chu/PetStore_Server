import Router, { RouterContext } from "koa-router";
import bodyParser from "koa-bodyparser";
import * as model from "../models/articles";
import * as likes from "../models/likes";
import * as favs from "../models/favs";
import * as msgs from "../models/msgs";
import { validateArticle } from "../controllers/validation";
import { basicAuth } from "../controllers/auth";

interface Post {
  id: number;
  title: string;
  alltext: string;
  summary: string;
  imageurl: string;
  authorid: number;
  description: string;
  links: {
    likes: string;
    fav: string;
    msg: string;
    self: string;
  };
}

const router: Router = new Router({ prefix: "/api/v1/articles" });

// Helper to generate full URLs for links and images
const BASE_URL = `https://${process.env.BASE_HOST}`;

const generateLinks = (postId: number) => ({
  likes: `${BASE_URL}/api/v1/articles/${postId}/likes`,
  fav: `${BASE_URL}/api/v1/articles/${postId}/fav`,
  msg: `${BASE_URL}/api/v1/articles/${postId}/msg`,
  self: `${BASE_URL}/api/v1/articles/${postId}`,
});

const generateFullImageUrl = (imageurl?: string) => {
  if (!imageurl) return "";
  return imageurl.startsWith("http") ? imageurl : `${BASE_URL}/${imageurl}`;
};

// Get all articles
const getAll = async (ctx: RouterContext, next: any) => {
  const result = await model.getAll(20, 1);
  const body: Post[] = result.map((post: any) => ({
    id: post.id || 0,
    title: post.title || "",
    alltext: post.alltext || "",
    summary: post.summary || "",
    imageurl: generateFullImageUrl(post.imageurl),
    authorid: post.authorid || 0,
    description: post.description || "",
    links: generateLinks(post.id),
  }));
  ctx.body = body;
  ctx.status = 200;
  await next();
};

// Get article by ID
const getById = async (ctx: RouterContext, next: any) => {
  const id = +ctx.params.id;
  const articles: any[] = await model.getById(id);

  if (articles.length) {
    const postData = articles[0];

    // Explicitly map to Post type
    const post: Post = {
      id: postData.id,
      title: postData.title,
      alltext: postData.alltext,
      summary: postData.summary || "",
      imageurl: generateFullImageUrl(postData.imageurl),
      authorid: postData.authorid,
      description: postData.description || "",
      links: generateLinks(postData.id),
    };

    ctx.body = post;
    ctx.status = 200;
  } else {
    ctx.status = 404;
    ctx.body = { error: "Article not found" };
  }
  await next();
};


// Get articles by title (with optional filter)
const getByTitle = async (ctx: RouterContext, next: any) => {
  const title: string = ctx.params.title || "";
  const filter: string | undefined =
    typeof ctx.query.filter === "string"
      ? ctx.query.filter
      : ctx.query.filter
      ? ctx.query.filter[0]
      : undefined;

  const article = await model.getByTitle(title, filter || "");
  if (article.length) {
    const body: Post[] = article.map((post: any) => ({
      id: post.id || 0,
      title: post.title || "",
      alltext: post.alltext || "",
      summary: post.summary || "",
      imageurl: generateFullImageUrl(post.imageurl),
      authorid: post.authorid || 0,
      description: post.description || "",
      links: generateLinks(post.id),
    }));
    ctx.body = body;
    ctx.status = 200;
  } else {
    ctx.status = 404;
    ctx.body = [];
  }
  await next();
};

// Create article
const createArticle = async (ctx: RouterContext, next: any) => {
  const body = ctx.request.body;
  const result = await model.add(body);
  if (result.status === 201) {
    ctx.status = 201;
    ctx.body = body;
  } else {
    ctx.status = 500;
    ctx.body = { err: "Insert data failed" };
  }
  await next();
};

// Update article
const updateArticle = async (ctx: RouterContext, next: any) => {
  const id = +ctx.params.id;
  const body = ctx.request.body;
  const result = await model.update(body, id);
  if (result) {
    ctx.status = 201;
    ctx.body = { message: `Article with id ${id} updated` };
  } else {
    ctx.status = 500;
    ctx.body = { error: "Update failed" };
  }
  await next();
};

// Delete article
const deleteArticle = async (ctx: RouterContext, next: any) => {
  const id = +ctx.params.id;
  const result: any = await model.deleteById(id);
  ctx.status = 200;
  ctx.body = result.affectedRows ? { message: "Removed" } : { message: "Error" };
  await next();
};

// Likes
async function likesCount(ctx: RouterContext, next: any) {
  const id = +ctx.params.id;
  const result = await likes.count(id);
  ctx.body = result || 0;
  await next();
}

async function likePost(ctx: RouterContext, next: any) {
  const user = ctx.state.user;
  const uid: number = user.user.id;
  const id = +ctx.params.id;
  const result: any = await likes.like(id, uid);
  ctx.body = result.affectedRows
    ? { message: "liked", userid: result.userid }
    : { message: "error" };
  await next();
}

async function dislikePost(ctx: RouterContext, next: any) {
  const user = ctx.state.user;
  const uid: number = user.user.id;
  const id = +ctx.params.id;
  const result: any = await likes.dislike(id, uid);
  ctx.body = result.affectedRows ? { message: "disliked" } : { message: "error" };
  await next();
}

// Favorites
async function userFav(ctx: RouterContext, next: any) {
  const user = ctx.state.user;
  const uid: number = user.user.id;
  const result = await favs.listFav(uid);
  ctx.body = result || 0;
  await next();
}

async function postFav(ctx: RouterContext, next: any) {
  const user = ctx.state.user;
  const uid: number = user.user.id;
  const id = +ctx.params.id;
  const result: any = await favs.addFav(id, uid);
  ctx.body = result.affectedRows
    ? { message: "added", userid: result.userid }
    : { message: "error" };
  await next();
}

async function rmFav(ctx: RouterContext, next: any) {
  const user = ctx.state.user;
  const uid: number = user.user.id;
  const id = +ctx.params.id;
  const result: any = await favs.removeFav(id, uid);
  ctx.body = result.affectedRows ? { message: "removed" } : { message: "error" };
  await next();
}

// Messages
async function listMsg(ctx: RouterContext, next: any) {
  const id = +ctx.params.id;
  const result = await msgs.getMsg(id);
  ctx.body = result || 0;
  await next();
}

async function addMsg(ctx: RouterContext, next: any) {
  const id = +ctx.params.id;
  const user = ctx.state.user;
  const uid: number = user.user.id;
  const uname = user.user.username;
  const msg: any = ctx.request.body;
  const result: any = await msgs.add_Msg(id, uid, uname, msg);
  ctx.body = result.affectedRows ? { message: "added" } : { message: "error" };
  await next();
}

async function rmMsg(ctx: RouterContext, next: any) {
  const id = +ctx.params.id;
  const body: any = ctx.request.body;
  const result: any = await msgs.removeMsg(id, body);
  ctx.body = result.affectedRows ? { message: "removed" } : { message: "error" };
  await next();
}

// Routes
router.get("/", getAll);
router.post("/", basicAuth, bodyParser(), validateArticle, createArticle);
router.get("/:id([0-9]{1,})", getById);
router.put("/:id([0-9]{1,})", basicAuth, bodyParser(), validateArticle, updateArticle);
router.delete("/:id([0-9]{1,})", basicAuth, deleteArticle);

router.get("/search/:title?", getByTitle);

router.get("/:id([0-9]{1,})/likes", likesCount);
router.post("/:id([0-9]{1,})/likes", basicAuth, likePost);
router.del("/:id([0-9]{1,})/likes", basicAuth, dislikePost);

router.get("/fav", basicAuth, userFav);
router.post("/:id([0-9]{1,})/fav", basicAuth, postFav);
router.del("/:id([0-9]{1,})/fav", basicAuth, rmFav);

router.get("/:id([0-9]{1,})/msg", listMsg);
router.post("/:id([0-9]{1,})/msg", bodyParser(), basicAuth, addMsg);
router.del("/:id([0-9]{1,})/msg", basicAuth, bodyParser(), rmMsg);

export { router };
