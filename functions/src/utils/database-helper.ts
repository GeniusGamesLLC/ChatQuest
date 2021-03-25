import * as admin from "firebase-admin";

/**
 * This will pull raw data from Firebase for the given path.
 * @param path
 */
export const getDataFromDatabasePath = async (path:string):Promise<any> =>{
    try {
      const snapshot = await admin.database().ref(path).once('value');
      return snapshot.val();
    }
    catch (e) {
      throw new Error(e);
    }
};

/**
 * Will set data to Database
 * @param data
 * @param path
 */
export const setDataToDatabasePath = async (data:any,path:string):Promise<any> => {
  try{
    await admin.database()
      .ref(path)
      .set(data);
  }
  catch (e) {
    throw new Error(e);
  }
};

/**
 * Will push data to the database. This should be an "array" path.
 * Firebase doesn't store "arrays" as an array if you push, its an object with keys, but acts similar to an array as you "push" to the stack.
 * Returns the database key that was generated.
 *
 * @param data
 * @param path
 */
export const pushDataToDatabasePath = async (data:any,path:string):Promise<any> => {
  try{
    return await admin.database()
      .ref(path)
      .push(data);
  }
  catch (e) {
    throw new Error(e);
  }
};

/**
 * This will increment a data value at the specified endpoint.
 * @param endpoint
 * @param increment
 */
export const incrementNumberAtDatabasePath = (endpoint: string, increment: number) => {
  return admin.database().ref(endpoint).transaction((currentValue) => {
    return (currentValue || 0) + increment;
  });
};
