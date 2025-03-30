import pymongo
from pymongo import MongoClient
import pandas as pd

# MONGO_DB_URL = 'mongodb://localhost:27017/Usersf'

class MongoReader:
    def __init__(self, mongo_url):
        self.mongo_url = mongo_url
        
        
    def df_creator_from_mongo(self):
        try:
            client = MongoClient(self.mongo_url)
            db = client['Usersf']
            collection = db['admindatas']
            cursor = collection.find({})
            df = pd.DataFrame(list(cursor))
            if '_id' in df.columns:
                df = df.drop('_id', axis=1)
            client.close()
            return df
        except Exception as e:
            raise"Error"
    
    
MongoReader('mongodb://localhost:27017/Usersf').df_creator_from_mongo()