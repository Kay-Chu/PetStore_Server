import * as db from '../helpers/database';

export const getAll = async  (limit=10, page=1) =>{
  const offset = (page - 1) * limit;
  const query = "SELECT * FROM users LIMIT  ? OFFSET  ?;";
  const data = await db.run_query(query, [limit, offset]);
  return data;
}

export const getSearch = async  (sfield:any,q:any) =>{
 const query = `SELECT ${sfield} FROM users WHERE ${sfield} LIKE '%${q}%' `;
 try{ const data = await db.run_query(query,null);
  return data;}
  catch(error) {
    return error
}
}

export const getByUserId = async  (id:number) =>{
  let query = "SELECT * FROM users WHERE id = ?"
  let values = [id]
  let data = await db.run_query(query, values)
  return data
}

  export const add = async  (user:any) =>{  
  let keys= Object.keys(user)
  let values= Object.values(user)  
  let key = keys.join(',')   
  let parm = ''
  for(let i =0; i<values.length; i++){ parm +='?,'}
  parm=parm.slice(0,-1)
  let query = `INSERT INTO users (${key}) VALUES (${parm})`
  try{
    await db.run_query(query, values)  
    return {"status": 201}
  } catch(error) {
    return error
  }
}

export const findByUsername = async (username: string) => {
  const query = 'SELECT * FROM users where username = ?';
  const user = await db.run_query(query,  [username] );
  return user;
}

export const  update= async(user:any,id:any)  =>{  

  //console.log("user " , user)
 // console.log("id ",id)
  let keys = Object.keys(user)
  let values = Object.values(user)  
  let updateString=""
  for(let i: number = 0; i<values.length;i++){updateString+=keys[i]+"="+"'"+values[i]+"'"+"," }
 updateString= updateString.slice(0, -1)
 // console.log("updateString ", updateString)
  let query = `UPDATE users SET ${updateString} WHERE ID=${id} RETURNING *;`
  try{
   await db.run_query(query, values)  
    return {"status": 201}
  } catch(error) {
    return error
  }
}

export const deleteById = async (id:any) => {
  let query = "Delete FROM users WHERE ID = ?"
  let values = [id]
  try{
    await db.run_query(query, values);  
    return { "affectedRows":1 }
  } catch(error) {
    return error
  }
}

export const findByEmail = async (email: string) => {
  
  const query = `SELECT * FROM users WHERE email = ?`;
  const data = await db.run_query(query, [email]);

  return data;  

}

// export function findOrCreate(userData: { googleId: string; email: string | undefined; name: string; }) {
//   throw new Error("Function not implemented.");
// }
export async function findOrCreate(userData: { googleId: string; email: string | undefined; }) {
  // Check if user exists with the Google ID or email
  let query = `SELECT * FROM users WHERE google_id = ? OR email = ?`;
  let existingUser = await db.run_query(query, [userData.googleId, userData.email]);

  if (existingUser.length > 0) {
    // User already exists, return the user
    return existingUser[0];
  } else {
    // No user found, create a new user
    let keys = Object.keys(userData).join(',');
    let values = Object.values(userData);
    let placeholders = values.map(() => '?').join(',');
    query = `INSERT INTO users (${keys}) VALUES (${placeholders}) RETURNING *;`;  // Using RETURNING * to get the inserted row

    try {
      let newUser = await db.run_query(query, values);
      if (newUser.length > 0) {
        return newUser[0];  // Assuming the insert returns the new user data
      } else {
        throw new Error('User creation failed');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
}
