import * as db from "../helpers/database";

export const getById = async (id: any) => {
  let query = "SELECT * FROM articles WHERE ID = ?";
  let values = [id];
  let data = await db.run_query(query, values);
  return data;
};


export const getAll = async (
  limit = 10,
  page = 1,
  // order: "datemodified",
  // direction: 'DESC'
) => {
  const offset = (page - 1) * limit;
  const query = `SELECT * FROM articles ORDER BY datemodified DESC LIMIT ? OFFSET ?;`;
  const data = await db.run_query(query, [limit, offset]);
  return data;
};

export const add = async (article: any) => {
  let keys = Object.keys(article);
  let values = Object.values(article);
  let key = keys.join(",");
  let param = "";
  for (let i: number = 0; i < values.length; i++) {
    param += "? ,";
  }
  param = param.slice(0, -1);
  let query = `INSERT INTO articles (${key}) VALUES (${param})`;
  try {
    await db.run_insert(query, values);
    return { status: 201 };
  } catch (err: any) {
    return err;
  }
};

export const update = async (article: any, id: any) => {
  //console.log("article " , article)
  // console.log("id ",id)
  let keys = Object.keys(article);
  let values = Object.values(article);
  let updateString = "";
  for (let i: number = 0; i < values.length; i++) {
    updateString += keys[i] + "=" + "'" + values[i] + "'" + ",";
  }
  updateString = updateString.slice(0, -1);
  // console.log("updateString ", updateString)
  let query = `UPDATE articles SET ${updateString} WHERE ID=${id} RETURNING *;`;
  try {
    await db.run_query(query, values);
    return { status: 201 };
  } catch (error) {
    return error;
  }
};

export const deleteById = async (id: any) => {
  let query = "Delete FROM articles WHERE ID = ?";
  let values = [id];
  try {
    await db.run_query(query, values);
    return { affectedRows: 1 };
  } catch (error) {
    return error;
  }
};

export const getByTitle = async (title = '', filter = '') => {
  let query = "SELECT * FROM articles";
  let conditions = [];
  let params = [];

  // If a title is provided, add a condition for title matching
  if (title) {
    conditions.push("title LIKE ?");
    params.push(`%${title}%`); // Format title for LIKE query
  }

  // If a filter is provided, add a condition for category matching
  if (filter) {
    conditions.push("category = ?");
    params.push(filter.toLowerCase()); // Ensure consistency in category filtering
  }

  // If there are any conditions, append them to the query
  if (conditions.length) {
    query += " WHERE " + conditions.join(" AND ");
  }

  // Execute the query
  const results = await db.run_query(query, params);
  return results;
};
